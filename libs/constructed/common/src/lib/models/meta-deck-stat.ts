import { DeckStat } from '@firestone-hs/constructed-deck-stats';
import { Sideboard } from '@firestone-hs/deckstrings';

export type ColumnSortType = 'player-class' | 'archetype' | 'winrate' | 'games' | 'cost';

export interface EnhancedDeckStat extends DeckStat {
	readonly dustCost: number;
	readonly rawWinrate: number;
	readonly heroCardClass: string;
	readonly standardDeviation: number;
	readonly conservativeWinrate: number;
	readonly sideboards: readonly Sideboard[];
}

export const formatGamesCount = (value: number): number => {
	if (value >= 1000) {
		return 1000 * Math.round(value / 1000);
	} else if (value >= 100) {
		return 100 * Math.round(value / 100);
	} else if (value >= 10) {
		return 10 * Math.round(value / 10);
	}
	return value;
};
