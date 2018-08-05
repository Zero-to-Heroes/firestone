export class CardHistory {

	id: string;
	cardId: string;
	cardName: string;
	rarity: string;
	dustValue: number;
	isPremium: boolean;
	isNewCard: boolean;
	relevantCount: number;
	creationTimestamp: number;

	constructor(cardId: string, cardName: string, rarity: string, dustValue: number, isPremium: boolean, isNewCard: boolean, relevantCount: number) {
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
