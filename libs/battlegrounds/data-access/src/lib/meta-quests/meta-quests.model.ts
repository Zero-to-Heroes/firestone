export interface BgsMetaQuestStatTier {
	readonly id: BgsQuestTier;
	readonly label: string;
	readonly tooltip: string;
	readonly items: readonly BgsMetaQuestStatTierItem[];
}

export interface BgsMetaQuestStatTierItem {
	readonly cardId: string;
	readonly name: string;
	readonly dataPoints: number;
	readonly averageTurnsToComplete: number;
	readonly difficulty?: number;
	readonly difficultyItems?: readonly BgsMetaQuestStatTierItem[];
}

export interface BgsMetaQuestRewardStatTier {
	readonly id: BgsQuestTier;
	readonly label: string;
	readonly tooltip: string;
	readonly items: readonly BgsMetaQuestRewardStatTierItem[];
}

export interface BgsMetaQuestRewardStatTierItem {
	readonly cardId: string;
	readonly name: string;
	readonly dataPoints: number;
	readonly averagePosition: number;
}

export type BgsQuestTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
