// TODO: rewards
export interface BgsMetaQuestStatTier {
	readonly id: BgsQuestTier;
	readonly label: string;
	readonly tooltip: string;
	readonly items: readonly BgsMetaQuestStatTierItem[];
}

export interface BgsMetaQuestStatTierItem {
	readonly cardId: string;
	readonly dataPoints: number;
	readonly averageTurnsToComplete: number;
	readonly tier?: BgsQuestTier;
}

export type BgsQuestTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
