/**
 * Measures board → first sim paint latency for Battlegrounds combat.
 *
 * Headline metric: boardsVisible → firstPaint (mean / p50 over fights).
 * Start: BG_BATTLE_STARTING=0 in power-log (combat boards visible in HS).
 * Hop breakdown: boardsVisible-to-kickoff, kickoff-to-first-result, result-to-paint.
 *
 * Exposed in dev builds as window.bgsSimLatencyStats() / bgsSimLatencyReset().
 */
export interface BgsSimLatencySample {
	readonly battleId: string;
	readonly boardToPaintMs: number;
	readonly queueToKickoffMs: number | null;
	readonly kickoffToFirstResultMs: number | null;
	readonly resultToPaintMs: number | null;
}

export interface BgsSimLatencyHopStats {
	readonly mean: number | null;
	readonly p50: number | null;
	readonly p90: number | null;
	readonly n: number;
}

export interface BgsSimLatencyStats {
	readonly n: number;
	readonly mean: number | null;
	readonly p50: number | null;
	readonly p90: number | null;
	readonly hops: {
		readonly queueToKickoff: BgsSimLatencyHopStats;
		readonly kickoffToFirstResult: BgsSimLatencyHopStats;
		readonly resultToPaint: BgsSimLatencyHopStats;
	};
	readonly samples: readonly BgsSimLatencySample[];
}

interface PendingBattle {
	/** performance.now() when BG_BATTLE_STARTING=0 was seen (boards visible). */
	boardsVisibleAt: number | null;
	kickoffAt: number | null;
	firstResultAt: number | null;
	firstPaintAt: number | null;
	completed: boolean;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const percentile = (sorted: readonly number[], p: number): number | null => {
	if (!sorted.length) {
		return null;
	}
	const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
	return sorted[idx];
};

const hopStats = (values: readonly number[]): BgsSimLatencyHopStats => {
	const sorted = [...values].sort((a, b) => a - b);
	const n = sorted.length;
	if (!n) {
		return { mean: null, p50: null, p90: null, n: 0 };
	}
	const mean = sorted.reduce((a, b) => a + b, 0) / n;
	return {
		mean: Math.round(mean * 10) / 10,
		p50: Math.round((percentile(sorted, 50) ?? 0) * 10) / 10,
		p90: Math.round((percentile(sorted, 90) ?? 0) * 10) / 10,
		n,
	};
};

/** Module singleton so Background markers and facade paint marks share one collector. */
class BgsSimLatencyCollector {
	private readonly pending = new Map<string, PendingBattle>();
	private readonly samples: BgsSimLatencySample[] = [];

	reset(): void {
		this.pending.clear();
		this.samples.length = 0;
	}

	/**
	 * Start of the headline timer: combat boards visible.
	 * Prefer `boardsVisibleAt` stamped at BG_BATTLE_STARTING=0 in the power-log parser;
	 * falls back to now() if the stamp is missing.
	 */
	markBoardsVisible(battleId: string, boardsVisibleAt?: number | null): void {
		if (!battleId) {
			return;
		}
		const existing = this.pending.get(battleId);
		if (existing?.completed) {
			return;
		}
		const t =
			boardsVisibleAt != null && Number.isFinite(boardsVisibleAt) ? boardsVisibleAt : now();
		this.pending.set(battleId, {
			boardsVisibleAt: existing?.boardsVisibleAt ?? t,
			kickoffAt: existing?.kickoffAt ?? null,
			firstResultAt: existing?.firstResultAt ?? null,
			firstPaintAt: existing?.firstPaintAt ?? null,
			completed: false,
		});
	}

	/** @deprecated use markBoardsVisible — kept as alias for call sites / older tests */
	markBoardAccepted(battleId: string, boardsVisibleAt?: number | null): void {
		this.markBoardsVisible(battleId, boardsVisibleAt);
	}

	markKickoff(battleId: string): void {
		if (!battleId) {
			return;
		}
		const entry = this.ensure(battleId);
		if (entry.completed || entry.kickoffAt != null) {
			return;
		}
		entry.kickoffAt = now();
	}

	markFirstResult(battleId: string): void {
		if (!battleId) {
			return;
		}
		const entry = this.ensure(battleId);
		if (entry.completed || entry.firstResultAt != null) {
			return;
		}
		entry.firstResultAt = now();
	}

	markFirstPaint(battleId: string): void {
		if (!battleId) {
			return;
		}
		const entry = this.ensure(battleId);
		if (entry.completed || entry.firstPaintAt != null) {
			return;
		}
		entry.firstPaintAt = now();
		this.finalize(battleId, entry);
	}

	getStats(): BgsSimLatencyStats {
		const boardToPaint = this.samples.map((s) => s.boardToPaintMs);
		const queueToKickoff = this.samples
			.map((s) => s.queueToKickoffMs)
			.filter((v): v is number => v != null);
		const kickoffToFirst = this.samples
			.map((s) => s.kickoffToFirstResultMs)
			.filter((v): v is number => v != null);
		const resultToPaint = this.samples
			.map((s) => s.resultToPaintMs)
			.filter((v): v is number => v != null);
		const headline = hopStats(boardToPaint);
		return {
			n: headline.n,
			mean: headline.mean,
			p50: headline.p50,
			p90: headline.p90,
			hops: {
				queueToKickoff: hopStats(queueToKickoff),
				kickoffToFirstResult: hopStats(kickoffToFirst),
				resultToPaint: hopStats(resultToPaint),
			},
			samples: [...this.samples],
		};
	}

	private ensure(battleId: string): PendingBattle {
		let entry = this.pending.get(battleId);
		if (!entry) {
			entry = {
				boardsVisibleAt: null,
				kickoffAt: null,
				firstResultAt: null,
				firstPaintAt: null,
				completed: false,
			};
			this.pending.set(battleId, entry);
		}
		return entry;
	}

	private finalize(battleId: string, entry: PendingBattle): void {
		if (entry.boardsVisibleAt == null || entry.firstPaintAt == null) {
			return;
		}
		entry.completed = true;
		const sample: BgsSimLatencySample = {
			battleId,
			boardToPaintMs: Math.round((entry.firstPaintAt - entry.boardsVisibleAt) * 10) / 10,
			queueToKickoffMs:
				entry.kickoffAt != null
					? Math.round((entry.kickoffAt - entry.boardsVisibleAt) * 10) / 10
					: null,
			kickoffToFirstResultMs:
				entry.firstResultAt != null && entry.kickoffAt != null
					? Math.round((entry.firstResultAt - entry.kickoffAt) * 10) / 10
					: null,
			resultToPaintMs:
				entry.firstPaintAt != null && entry.firstResultAt != null
					? Math.round((entry.firstPaintAt - entry.firstResultAt) * 10) / 10
					: null,
		};
		this.samples.push(sample);
		console.log(
			'[bgs-sim-latency]',
			`battle=${battleId}`,
			`boardsVisible→paint=${sample.boardToPaintMs}ms`,
			`visible→kickoff=${sample.queueToKickoffMs ?? 'n/a'}ms`,
			`kickoff→result=${sample.kickoffToFirstResultMs ?? 'n/a'}ms`,
			`result→paint=${sample.resultToPaintMs ?? 'n/a'}ms`,
		);
	}
}

export const bgsSimLatency = new BgsSimLatencyCollector();
