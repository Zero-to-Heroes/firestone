import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { OutcomeSamples, SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { BgsBattleSimulationExecutorService } from '@firestone/battlegrounds/core';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { cpus } from 'os';
import { join } from 'path';
import { Worker } from 'worker_threads';

// The simulation is embarrassingly parallel: N independent Monte-Carlo runs whose counts just add
// up. On Linux the whole game-event pipeline (and thus the simulation) runs in the main process, so
// a single worker_thread leaves every other core idle and the 8000-sim run lands a whole round late.
//
// Two things make it fast:
//   1. One worker per core (minus one kept free for the main process, overlay and game), splitting
//      the requested sims and merging the tallies -- near-linear wall-clock speedup.
//   2. A *persistent* warm pool. The workers loop on messages, so they are spawned once and reused;
//      the large card database is shipped to each worker only on its first job and cached there.
//      Respawning workers and re-deserializing the whole card DB on every combat was a big chunk of
//      each simulation's latency.
// Only one worker records outcome samples (the replay data), since only one sample set is kept --
// the rest skip that extra work.

interface WorkerMessage {
	runId: number;
	data: string | null;
	done: boolean;
}

@Injectable()
export class BgsBattleSimulationWorkerService extends BgsBattleSimulationExecutorService {
	// Merged intermediate results are throttled so a burst from several workers cannot flood the UI.
	private lastIntermediateUpdate = 0;
	private readonly INTERMEDIATE_UPDATE_THROTTLE_MS = 100;

	// One worker per core minus one; fixed for the machine's lifetime so the pool size is stable.
	private readonly poolSize = Math.max(1, (cpus()?.length ?? 1) - 1);
	private readonly workerPath = join(__dirname, 'bgs-battle-sim-worker.thread.js');
	private pool: (Worker | null)[] = [];
	private workerHasCards: boolean[] = [];

	// Broadcasts the current run id to every worker. Bumped when a new run starts; workers check it
	// between simulation steps and quietly abandon a superseded run instead of being killed, which
	// keeps their cached card database intact (no reload) while still dropping stale work fast.
	private readonly sharedRunIdBuffer = new SharedArrayBuffer(4);
	private readonly sharedRunId = new Int32Array(this.sharedRunIdBuffer);

	// State of the run currently in flight. Only one battle simulates at a time (combat is
	// sequential), so a single set of fields plus a monotonic run id is enough: messages tagged with
	// a stale run id -- a straggler from the previous battle -- are ignored.
	private runId = 0;
	private curRun = -1;
	private curDone = true;
	private curStreaming = false;
	private curCallback: ((result: SimulationResult | null) => void) | null = null;
	private latest: (SimulationResult | null)[] = [];
	private settled: boolean[] = [];

	constructor(private readonly cards: CardsFacadeService) {
		super();
	}

	public simulateLocalBattle(
		battleInfo: BgsBattleInfo,
		prefs: Preferences,
		includeOutcomeSamples: boolean,
		onResultReceived: (result: SimulationResult | null) => void,
	): void {
		const totalSims = battleInfo.options?.numberOfSimulations ?? prefs.bgsSimulatorNumberOfSims;
		const n = this.poolSize;
		this.ensurePool();

		// Board info can update several times during one combat (the opponent board is revealed
		// progressively), starting a fresh run each time. Bumping the shared run id supersedes any
		// still-running previous run: those workers notice mid-flight and abandon it, then pick up
		// this run from their queue -- no worker is killed, so the cached card database survives and
		// there is no reload. The abandoned run is simply never completed; this one replaces it.
		this.curStreaming = ((battleInfo.options as any)?.intermediateResults ?? 0) > 0;
		this.curRun = ++this.runId;
		Atomics.store(this.sharedRunId, 0, this.curRun);
		this.curDone = false;
		this.curCallback = onResultReceived;
		this.latest = new Array(n).fill(null);
		this.settled = new Array(n).fill(false);

		// Distribute the sims across workers; the remainder is spread over the first few so the totals
		// add back up to exactly the requested count.
		const base = Math.floor(totalSims / n);
		const remainder = totalSims - base * n;

		let dispatched = 0;
		for (let i = 0; i < n; i++) {
			const simsForWorker = base + (i < remainder ? 1 : 0);
			const worker = this.pool[i];
			if (simsForWorker <= 0 || !worker) {
				this.settled[i] = true;
				continue;
			}
			const job: any = {
				runId: this.curRun,
				battleMessage: {
					...battleInfo,
					options: {
						...battleInfo.options,
						numberOfSimulations: simsForWorker,
						// Only the first worker records outcome samples; a single sample set is kept.
						includeOutcomeSamples: i === 0 && includeOutcomeSamples,
					},
				} as BgsBattleInfo,
			};
			// Ship the card database once per worker; it is cached inside the worker afterwards.
			if (!this.workerHasCards[i]) {
				job.cards = this.cards.getService();
				this.workerHasCards[i] = true;
			}
			worker.postMessage(job);
			dispatched++;
		}

		// Nothing to run (totalSims === 0, or the whole pool is down): report immediately.
		if (dispatched === 0 || this.settled.every((s) => s)) {
			this.finishRun();
		}
	}

	// Creates the pool on first use and refills any slot whose worker has died.
	private ensurePool(): void {
		for (let i = 0; i < this.poolSize; i++) {
			if (this.pool[i]) {
				continue;
			}
			try {
				const worker = new Worker(this.workerPath, { workerData: { sharedRunId: this.sharedRunIdBuffer } });
				const idx = i;
				// A preempted worker is terminated and its slot immediately recreated, so its late
				// error/exit events must not touch the fresh worker now occupying the slot: act only
				// while this exact worker still owns it.
				worker.on('message', (msg: WorkerMessage) => this.onWorkerMessage(idx, msg));
				worker.on('error', (error: Error) => {
					console.error('[bgs-simulation] Worker error:', error?.message ?? error, error?.stack ?? '');
					if (this.pool[idx] !== worker) {
						return;
					}
					this.dropWorker(idx);
					this.onWorkerGone(idx);
				});
				worker.on('exit', (code) => {
					if (this.pool[idx] !== worker) {
						// Intentionally preempted; the slot has already moved on.
						return;
					}
					// Still the active worker, so this is an unexpected death: drop the slot so it is
					// recreated on the next run, and unblock a run waiting on it.
					if (code !== 0) {
						console.error(`[bgs-simulation] Worker stopped with exit code ${code}`);
					}
					this.dropWorker(idx);
					this.onWorkerGone(idx);
				});
				this.pool[i] = worker;
				this.workerHasCards[i] = false;
			} catch (e) {
				console.error('[bgs-simulation] could not spawn worker', e);
				this.pool[i] = null;
				this.workerHasCards[i] = false;
			}
		}
	}

	private dropWorker(idx: number): void {
		this.pool[idx] = null;
		this.workerHasCards[idx] = false;
	}

	// A worker vanished mid-run: treat its share as failed so the run can still complete.
	private onWorkerGone(idx: number): void {
		if (this.curDone) {
			return;
		}
		this.settleWorker(idx);
	}

	private onWorkerMessage(idx: number, msg: WorkerMessage): void {
		// Ignore stragglers from a previous battle and anything after this run has finished.
		if (!msg || msg.runId !== this.curRun || this.curDone) {
			return;
		}
		if (msg.data === null) {
			this.settleWorker(idx);
			return;
		}
		this.latest[idx] = JSON.parse(msg.data) as SimulationResult;
		if (msg.done) {
			this.settleWorker(idx);
		} else {
			this.emitIntermediate();
		}
	}

	private settleWorker(idx: number): void {
		if (this.settled[idx]) {
			return;
		}
		this.settled[idx] = true;
		if (this.settled.every((s) => s)) {
			this.finishRun();
		}
	}

	private finishRun(): void {
		if (this.curDone) {
			return;
		}
		this.curDone = true;
		const finals = this.latest.filter((r): r is SimulationResult => !!r);
		const callback = this.curCallback;
		this.curCallback = null;
		callback?.(finals.length ? this.mergeSimulationResults(finals, true) : null);
	}

	private emitIntermediate(): void {
		if (this.curDone || !this.curStreaming) {
			return;
		}
		const now = Date.now();
		if (now - this.lastIntermediateUpdate < this.INTERMEDIATE_UPDATE_THROTTLE_MS) {
			return;
		}
		this.lastIntermediateUpdate = now;
		const known = this.latest.filter((r): r is SimulationResult => !!r);
		if (known.length) {
			this.curCallback?.(this.mergeSimulationResults(known, false));
		}
	}

	// Sums the tallies from each worker's run back into one result. The counts add; the percentages
	// and averages are recomputed from the combined totals.
	private mergeSimulationResults(results: SimulationResult[], includeSamples: boolean): SimulationResult {
		const sum = (pick: (r: SimulationResult) => number): number => results.reduce((a, r) => a + (pick(r) ?? 0), 0);
		const concatNums = (pick: (r: SimulationResult) => number[]): number[] =>
			results.reduce((a, r) => a.concat(pick(r) ?? []), [] as number[]);

		const wonLethal = sum((r) => r.wonLethal);
		const won = sum((r) => r.won);
		const tied = sum((r) => r.tied);
		const lost = sum((r) => r.lost);
		const lostLethal = sum((r) => r.lostLethal);
		const damageWon = sum((r) => r.damageWon);
		const damageLost = sum((r) => r.damageLost);
		const damageWons = concatNums((r) => r.damageWons);
		const damageLosts = concatNums((r) => r.damageLosts);
		const totalBattles = won + tied + lost;

		const range = (ranges: ({ min: number; max: number } | undefined)[]): { min: number; max: number } => {
			const present = ranges.filter((r): r is { min: number; max: number } => !!r);
			if (!present.length) {
				return { min: 0, max: 0 };
			}
			return {
				min: Math.min(...present.map((r) => r.min)),
				max: Math.max(...present.map((r) => r.max)),
			};
		};

		let outcomeSamples: OutcomeSamples | undefined = undefined;
		if (includeSamples) {
			// Keep a single representative replay per outcome, as the single-worker path did.
			const gather = (pick: (s: OutcomeSamples) => readonly any[]) =>
				results
					.map((r) => (r.outcomeSamples ? pick(r.outcomeSamples) : []))
					.reduce((a, b) => a.concat(b), [])
					.slice(0, 1);
			outcomeSamples = {
				won: gather((s) => s.won),
				tied: gather((s) => s.tied),
				lost: gather((s) => s.lost),
			};
		}

		return {
			wonLethal: wonLethal,
			won: won,
			tied: tied,
			lost: lost,
			lostLethal: lostLethal,
			damageWon: damageWon,
			damageWons: damageWons,
			damageWonRange: range(results.map((r) => r.damageWonRange)),
			damageLost: damageLost,
			damageLosts: damageLosts,
			damageLostRange: range(results.map((r) => r.damageLostRange)),
			averageDamageWon: won === 0 ? 0 : damageWon / won,
			averageDamageLost: lost === 0 ? 0 : damageLost / lost,
			wonLethalPercent: totalBattles === 0 ? 0 : (100 * wonLethal) / totalBattles,
			wonPercent: totalBattles === 0 ? 0 : (100 * won) / totalBattles,
			tiedPercent: totalBattles === 0 ? 0 : (100 * tied) / totalBattles,
			lostPercent: totalBattles === 0 ? 0 : (100 * lost) / totalBattles,
			lostLethalPercent: totalBattles === 0 ? 0 : (100 * lostLethal) / totalBattles,
			outcomeSamples: outcomeSamples,
		};
	}
}
