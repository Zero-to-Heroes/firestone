export interface Card {
	readonly id: string;
	readonly count: number;
	readonly premiumCount: number;
	readonly diamondCount: number;
	readonly signatureCount: number;
}

export const totalOwned = (card: Card) =>
	!!card ? card.count + card.premiumCount + card.diamondCount + card.signatureCount : 0;
