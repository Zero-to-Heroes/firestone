/** Minimal fields used by {@link StatsRecap.from}; avoids importing the stats data-access package graph. */
export interface StatsRecapInputStat {
	readonly creationTimestamp: number;
	readonly result: string;
}

export class StatsRecap {
	readonly opponentClass: string | undefined;
	readonly dateFrom: Date;
	readonly totalWins: number;
	readonly totalLosses: number;
	readonly winratePercent: number;

	public static from(deckStats: readonly StatsRecapInputStat[], opponentClass?: string): StatsRecap | null {
		console.debug('building stats recap', deckStats, opponentClass);
		if (!deckStats || deckStats.length === 0) {
			return null;
		}
		const copy = [...deckStats];
		const earliest = copy.sort((a, b) => a.creationTimestamp - b.creationTimestamp)[0];
		const wins = copy.filter((stat) => stat.result === 'won').length;
		const losses = copy.filter((stat) => stat.result === 'lost').length;
		const result = Object.assign(new StatsRecap(), {
			dateFrom: new Date(earliest.creationTimestamp),
			totalWins: wins,
			totalLosses: losses,
			winratePercent: (100 * wins) / (wins + losses),
			opponentClass: opponentClass,
		} as StatsRecap);
		console.debug('returning', result, earliest, wins, losses);
		return result;
	}
}
