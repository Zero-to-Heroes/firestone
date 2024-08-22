export interface BgsMetaTrinketStatTier {
	readonly id: BgsTrinketTier;
	readonly label: string;
	readonly tooltip: string;
	readonly items: readonly BgsMetaTrinketStatTierItem[];
}

export interface BgsMetaTrinketStatTierItem {
	readonly cardId: string;
	readonly name: string;
	readonly dataPoints: number;
	readonly pickRate: number;
	readonly pickRateTop25: number;
	readonly averagePlacement: number;
	readonly averagePlacementTop25: number;
}

export type BgsTrinketTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
