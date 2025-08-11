export interface QuestReward {
	readonly cardId: string;
	readonly completed: boolean;
	readonly completedTurn: number | null;
	readonly isHeroPower: boolean;
}
