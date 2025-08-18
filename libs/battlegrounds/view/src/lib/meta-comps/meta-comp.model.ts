import { Entity } from '@firestone-hs/replay-parser';

export interface BgsMetaCompStatTier {
	readonly id: BgsCompTier | null;
	readonly label: string | null;
	readonly tooltip: string | null;
	readonly items: readonly BgsMetaCompStatTierItem[];
}

export interface BgsMetaCompStatTierItem {
	readonly compId: string;
	readonly name: string;
	readonly dataPoints: number;
	// Not sure this is an intesting metric to show. Because there are two ways to approach it:
	// - We compute the firsts for that comp compare to the total firsts, but in this case we will overestimate the more popular comps
	// - We weigh that with the number of games detected for that comp, but then we're back to square one where comps that come online later
	// will have a lower number of games, and so a higher proportion of 1sts
	// Maybe limiting the number of games we account for to top 4 could be a good compromise
	readonly firstPercent: number;
	readonly averagePlacement: number;
	readonly expertRating?: 'D' | 'C' | 'B' | 'A' | 'S';
	readonly expertDifficulty?: 'Easy' | 'Medium' | 'Hard';
	readonly coreCards: readonly BgsMetaCompCard[];
	readonly addonCards: readonly BgsMetaCompCard[];
}

export interface BgsMetaCompCard {
	readonly cardId: string;
	readonly entity: Entity;
}

export type BgsCompTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

export type ColumnSortTypeComp = 'position' | 'expert-rating' | 'expert-difficulty' | 'first';
