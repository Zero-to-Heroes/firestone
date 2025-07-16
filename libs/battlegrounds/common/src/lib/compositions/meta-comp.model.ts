import { Entity } from '@firestone-hs/replay-parser';

export interface BgsMetaCompStatTier {
	readonly id: BgsCompTier;
	readonly label: string;
	readonly tooltip: string;
	readonly items: readonly BgsMetaCompStatTierItem[];
}

export interface BgsMetaCompStatTierItem {
	readonly compId: string;
	readonly name: string;
	readonly dataPoints: number;
	readonly averagePlacement: number;
	readonly coreCards: readonly BgsMetaCompCard[];
	readonly addonCards: readonly BgsMetaCompCard[];
}

export interface BgsMetaCompCard {
	readonly cardId: string;
	readonly entity: Entity;
}

export type BgsCompTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
