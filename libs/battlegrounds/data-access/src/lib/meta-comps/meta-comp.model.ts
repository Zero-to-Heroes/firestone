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
}

export type BgsCompTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
