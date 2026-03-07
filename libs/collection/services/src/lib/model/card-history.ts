export interface CardHistory {
	readonly cardId: string;
	readonly premium: number;
	readonly isNewCard: boolean;
	readonly relevantCount: number;
	readonly creationTimestamp: number;
}
