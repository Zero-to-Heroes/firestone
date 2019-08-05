export class CardHistory {
	readonly id: string;
	readonly cardId: string;
	readonly cardName: string;
	readonly rarity: string;
	readonly dustValue: number;
	readonly isPremium: boolean;
	readonly isNewCard: boolean;
	readonly relevantCount: number;
	readonly creationTimestamp: number;

	constructor(
		cardId: string,
		cardName: string,
		rarity: string,
		dustValue: number,
		isPremium: boolean,
		isNewCard: boolean,
		relevantCount: number,
	) {
		this.cardId = cardId;
		this.cardName = cardName;
		this.rarity = rarity;
		this.dustValue = dustValue;
		this.isPremium = isPremium;
		this.isNewCard = isNewCard;
		this.relevantCount = relevantCount;
		this.creationTimestamp = Date.now();
	}
}
