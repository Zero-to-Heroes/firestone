export class Set {
	id: string;
	name: string;
	allCards: SetCard[] = [];

	ownedCards = 0;

	constructor(id: string, name: string) {
		this.id = id;
		this.name = name;
	}

	numberOfCards(): number {
		let totalCards = 0;
		this.allCards.forEach((card: SetCard) => {
			totalCards += card.rarity.toLowerCase() === 'legendary' ? 1 : 2;
		})
		return totalCards;
	}

	ownedForRarity(rarity: string): number {
		return this.allCards
			.filter((card) => card.rarity.toLowerCase() === rarity)
			.map((card: SetCard) => card.getNumberCollected())
			.reduce((c1, c2) => c1 + c2, 0);
	}

	totalForRarity(rarity: string): number {
		return this.allCards
			.filter((card) => card.rarity.toLowerCase() === rarity)
			.map((card: SetCard) => card.getMaxCollectible())
			.reduce((c1, c2) => c1 + c2, 0);
	}

	missingCards(rarity: string): MissingCard[] {
		return this.allCards
			.filter((card) => !rarity || card.rarity.toLowerCase() === rarity)
			.filter((card) => card.getNumberCollected() < card.getMaxCollectible())
			.map((card: SetCard) => new MissingCard(card.id, card.name, card.getNumberCollected(), card.getMaxCollectible()));
	}
}

export class SetCard {
	id: string;
	name: string;
	rarity: string;
	ownedNonPremium = 0;
	ownedPremium = 0;

	constructor(id: string, name: string, rarity: string) {
		this.id = id;
		this.name = name;
		this.rarity = rarity;
	}

	getNumberCollected(): number {
		return Math.min(this.ownedPremium + this.ownedNonPremium, this.getMaxCollectible());
	}

	getMaxCollectible(): number {
		return this.rarity.toLowerCase() === 'legendary' ? 1 : 2;
	}
}

export class MissingCard {
	id: string;
	name: string;
	collected: number;
	maxCollectible: number;

	constructor(id: string, name: string, collected: number, maxCollectible: number) {
		this.id = id;
		this.name = name;
		this.collected = collected;
		this.maxCollectible = maxCollectible;
	}
}
