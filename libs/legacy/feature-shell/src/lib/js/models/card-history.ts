export interface CardHistory {
	readonly cardId: string;
	readonly isPremium: boolean;
	readonly isNewCard: boolean;
	readonly relevantCount: number;
	readonly creationTimestamp: number;
}
