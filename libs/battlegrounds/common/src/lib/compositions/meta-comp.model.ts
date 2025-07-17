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
