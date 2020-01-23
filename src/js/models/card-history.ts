export class CardHistory {
	readonly id: string;
	readonly cardId: string;
	readonly isPremium: boolean;
	readonly isNewCard: boolean;
	readonly relevantCount: number;
	readonly creationTimestamp: number;

	constructor(
		cardId: string,
		isPremium: boolean,
		isNewCard: boolean,
		relevantCount: number,
	) {
		this.cardId = cardId;
		this.isPremium = isPremium;
		this.isNewCard = isNewCard;
		this.relevantCount = relevantCount;
		this.creationTimestamp = Date.now();
	}
}
