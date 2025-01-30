export interface BgsMetaCardStatTier {
	readonly id: BgsCardTier;
	readonly label: string;
	readonly tooltip: string;
	readonly items: readonly BgsMetaCardStatTierItem[];
}

export interface BgsMetaCardStatTierItem {
	readonly cardId: string;
	readonly name: string;
	readonly dataPoints: number;
	// readonly pickRate: number;
	// readonly pickRateTop25: number;
	readonly averagePlacement: number;
	readonly impact: number;
	// readonly averagePlacementTop25: number;
}

export type BgsCardTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
