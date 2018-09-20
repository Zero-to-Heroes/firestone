import { PityTimer } from "./pity-timer";

export class Set {
	readonly id: string;
	readonly name: string;
	readonly standard: boolean;
	readonly allCards: ReadonlyArray<SetCard> = [];
	readonly pityTimer: PityTimer;

	readonly ownedLimitCollectibleCards: number = 0;
	readonly ownedLimitCollectiblePremiumCards: number = 0;

	constructor(
			id: string, 
			name: string, 
			isStandard: boolean, 
			allCards?: SetCard[],
			pityTimer?: PityTimer,
			ownedLimitCollectibleCards?: number, 
			ownedLimitCollectiblePremiumCards?: number) {
		this.id = id;
		this.name = name;
		this.standard = isStandard;
		this.allCards = allCards ? [...allCards] : [];
		this.pityTimer = pityTimer;
		this.ownedLimitCollectibleCards = ownedLimitCollectibleCards || 0;
		this.ownedLimitCollectiblePremiumCards = ownedLimitCollectiblePremiumCards || 0;
	}

	numberOfLimitCollectibleCards(): number {
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

	// missingCards(rarity?: string): MissingCard[] {
	// 	return this.allCards
	// 		.filter((card) => !rarity || card.rarity.toLowerCase() === rarity)
	// 		.filter((card) => card.getNumberCollected() < card.getMaxCollectible())
	// 		.map(c => {
	// 			let newC: any = new SetCard(c.id, c.name, c.rarity);
	// 			newC.ownedPremium = c.ownedPremium;
	// 			newC.ownedNonPremium = c.ownedNonPremium;
	// 			switch (newC.rarity.toLowerCase()) {
	// 				case ('common'):
	// 					newC.sort = 'a';
	// 					break;
	// 				case ('rare'):
	// 					newC.sort = 'b';
	// 					break;
	// 				case ('epic'):
	// 					newC.sort = 'c';
	// 					break;
	// 				case ('legendary'):
	// 					newC.sort = 'd';
	// 					break;
	// 			}
	// 			return newC;
	// 		})
	// 		.sort((c1, c2) => {
	// 			if (c1.name > c2.name) {
	// 		        return 1;
	// 		    }

	// 		    if (c1.name < c2.name) {
	// 		        return -1;
	// 		    }

	// 		    return 0;
	// 		})
	// 		.sort((c1, c2) => {
	// 			if (c1.sort > c2.sort) {
	// 		        return 1;
	// 		    }

	// 		    if (c1.sort < c2.sort) {
	// 		        return -1;
	// 		    }

	// 		    return 0;
	// 		})
	// 		.map((card: any) => new MissingCard(card.id, card.name, card.getNumberCollected(), card.getMaxCollectible()));
	// }
}

export class SetCard {
	readonly id: string;
	readonly name: string;
	readonly cardClass: string;
	readonly rarity: string;
	readonly cost: number;
	readonly ownedNonPremium: number = 0;
	readonly ownedPremium: number = 0;

	constructor(
		id: string, 
		name: string, 
		cardClass: string, 
		rarity: string, 
		cost: number, 
		ownedNonPremium?: number, 
		ownedPremium?: number) {
		this.id = id;
		this.name = name;
		this.cardClass = cardClass ? cardClass.toLowerCase() : cardClass;
		this.rarity = rarity;
		this.cost = cost;
		this.ownedNonPremium = ownedNonPremium || 0;
		this.ownedPremium = ownedPremium || 0;
	}

	getNumberCollected(): number {
		return ~~Math.min(this.ownedPremium + this.ownedNonPremium, this.getMaxCollectible());
	}

	getNumberCollectedPremium(): number {
		return ~~Math.min(this.ownedPremium, this.getMaxCollectible());
	}

	getMaxCollectible(): number {
		return this.rarity.toLowerCase() === 'legendary' ? 1 : 2;
	}

	isOwned(): boolean {
		return this.ownedPremium + this.ownedNonPremium > 0;
	}
}
