/**
 * Measures Battlegrounds combat latency around battle simulation.
 *
 * Headline metric: boardsVisible → kickoff (mean / p50 over fights).
 * Start: PTL BG_BATTLE_STARTING=0 log line *received* (combat boards visible in HS),
 * falling back to parser process-time if the receive stamp is missing.
 * End of headline: startBgsBattleSimulation / markKickoff — excludes sim CPU variance.
 *
 * Optional hops (filled when available): kickoff→firstResult, result→paint, boardsVisible→paint.
 *
 * Exposed in dev builds as window.bgsSimLatencyStats() / bgsSimLatencyReset().
 */
export interface BgsSimLatencySample {
	readonly battleId: string;
	/** Headline: boardsVisible → startBgsBattleSimulation. */
	readonly visibleToKickoffMs: number;
	/** @deprecated alias of visibleToKickoffMs — kept for older log parsers */
	readonly queueToKickoffMs: number;
	readonly kickoffToFirstResultMs: number | null;
	readonly resultToPaintMs: number | null;
	readonly boardToPaintMs: number | null;
}

export interface BgsSimLatencyHopStats {
	readonly mean: number | null;
	readonly p50: number | null;
	readonly p90: number | null;
	readonly n: number;
}

export interface BgsSimLatencyStats {
	/** Headline = boardsVisible → kickoff. */
	readonly n: number;
	readonly mean: number | null;
	readonly p50: number | null;
	readonly p90: number | null;
	readonly hops: {
		readonly visibleToKickoff: BgsSimLatencyHopStats;
		/** @deprecated same as visibleToKickoff */
		readonly queueToKickoff: BgsSimLatencyHopStats;
		readonly kickoffToFirstResult: BgsSimLatencyHopStats;
		readonly resultToPaint: BgsSimLatencyHopStats;
		readonly boardToPaint: BgsSimLatencyHopStats;
	};
	readonly samples: readonly BgsSimLatencySample[];
}

interface PendingBattle {
	boardsVisibleAt: number | null;
	kickoffAt: number | null;
	firstResultAt: number | null;
	firstPaintAt: number | null;
	/** Sample index in `samples` once kickoff was recorded. */
	sampleIndex: number | null;
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

const roundMs = (ms: number) => Math.round(ms * 10) / 10;

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
	 * Prefer receive-time stamp (before the game-events queue); falls back to now().
	 */
	markBoardsVisible(battleId: string, boardsVisibleAt?: number | null): void {
		if (!battleId) {
			return;
		}
		const existing = this.pending.get(battleId);
		if (existing?.sampleIndex != null) {
			return;
		}
		const t =
			boardsVisibleAt != null && Number.isFinite(boardsVisibleAt) ? boardsVisibleAt : now();
		this.pending.set(battleId, {
			boardsVisibleAt: existing?.boardsVisibleAt ?? t,
			kickoffAt: existing?.kickoffAt ?? null,
			firstResultAt: existing?.firstResultAt ?? null,
			firstPaintAt: existing?.firstPaintAt ?? null,
			sampleIndex: existing?.sampleIndex ?? null,
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
		if (entry.kickoffAt != null) {
			return;
		}
		entry.kickoffAt = now();
		this.recordKickoffSample(battleId, entry);
	}

	markFirstResult(battleId: string): void {
		if (!battleId) {
			return;
		}
		const entry = this.ensure(battleId);
		if (entry.firstResultAt != null) {
			return;
		}
		entry.firstResultAt = now();
		this.patchSample(entry);
	}

	markFirstPaint(battleId: string): void {
		if (!battleId) {
			return;
		}
		const entry = this.ensure(battleId);
		if (entry.firstPaintAt != null) {
			return;
		}
		entry.firstPaintAt = now();
		this.patchSample(entry);
	}

	getStats(): BgsSimLatencyStats {
		const visibleToKickoff = this.samples.map((s) => s.visibleToKickoffMs);
		const kickoffToFirst = this.samples
			.map((s) => s.kickoffToFirstResultMs)
			.filter((v): v is number => v != null);
		const resultToPaint = this.samples
			.map((s) => s.resultToPaintMs)
			.filter((v): v is number => v != null);
		const boardToPaint = this.samples
			.map((s) => s.boardToPaintMs)
			.filter((v): v is number => v != null);
		const headline = hopStats(visibleToKickoff);
		return {
			n: headline.n,
			mean: headline.mean,
			p50: headline.p50,
			p90: headline.p90,
			hops: {
				visibleToKickoff: headline,
				queueToKickoff: headline,
				kickoffToFirstResult: hopStats(kickoffToFirst),
				resultToPaint: hopStats(resultToPaint),
				boardToPaint: hopStats(boardToPaint),
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
				sampleIndex: null,
			};
			this.pending.set(battleId, entry);
		}
		return entry;
	}

	private recordKickoffSample(battleId: string, entry: PendingBattle): void {
		if (entry.boardsVisibleAt == null || entry.kickoffAt == null || entry.sampleIndex != null) {
			return;
		}
		const visibleToKickoffMs = roundMs(entry.kickoffAt - entry.boardsVisibleAt);
		entry.sampleIndex = this.samples.length;
		this.samples.push({
			battleId,
			visibleToKickoffMs,
			queueToKickoffMs: visibleToKickoffMs,
			kickoffToFirstResultMs: null,
			resultToPaintMs: null,
			boardToPaintMs: null,
		});
		console.log(
			'[bgs-sim-latency]',
			`battle=${battleId}`,
			`boardsVisible→kickoff=${visibleToKickoffMs}ms`,
		);
	}

	private patchSample(entry: PendingBattle): void {
		if (entry.sampleIndex == null || entry.boardsVisibleAt == null || entry.kickoffAt == null) {
			return;
		}
		const prev = this.samples[entry.sampleIndex];
		if (!prev) {
			return;
		}
		const kickoffToFirstResultMs =
			entry.firstResultAt != null ? roundMs(entry.firstResultAt - entry.kickoffAt) : null;
		const resultToPaintMs =
			entry.firstPaintAt != null && entry.firstResultAt != null
				? roundMs(entry.firstPaintAt - entry.firstResultAt)
				: null;
		const boardToPaintMs =
			entry.firstPaintAt != null ? roundMs(entry.firstPaintAt - entry.boardsVisibleAt) : null;
		this.samples[entry.sampleIndex] = {
			...prev,
			kickoffToFirstResultMs,
			resultToPaintMs,
			boardToPaintMs,
		};
	}
}

export const bgsSimLatency = new BgsSimLatencyCollector();
