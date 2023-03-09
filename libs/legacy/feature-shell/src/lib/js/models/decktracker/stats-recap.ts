import { GameStat } from '@firestone/stats/data-access';

export class StatsRecap {
	readonly opponentClass: string | undefined;
	readonly dateFrom: Date;
	readonly totalWins: number;
	readonly totalLosses: number;
	readonly winratePercent: number;

	public static from(deckStats: readonly GameStat[], opponentClass?: string): StatsRecap {
		if (!deckStats || deckStats.length === 0) {
			return null;
		}
		const copy = [...deckStats];
		const earliest = copy.sort((a, b) => a.creationTimestamp - b.creationTimestamp)[0];
		const wins = copy.filter((stat) => stat.result === 'won').length;
		const losses = copy.filter((stat) => stat.result === 'lost').length;
		return Object.assign(new StatsRecap(), {
			dateFrom: new Date(earliest.creationTimestamp),
			totalWins: wins,
			totalLosses: losses,
			winratePercent: (100 * wins) / (wins + losses),
			opponentClass: opponentClass,
		} as StatsRecap);
	}
}
