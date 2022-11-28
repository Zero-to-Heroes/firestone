import { NonFunctionProperties } from '../services/utils';
import { PityTimer } from './pity-timer';

export class Set {
	readonly allCards: readonly SetCard[] = [];
	readonly pityTimer: PityTimer;

	readonly ownedLimitCollectibleCards: number = 0;
	readonly ownedLimitCollectiblePremiumCards: number = 0;

	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly launchDate: Date,
		public readonly standard?: boolean,
		allCards?: readonly SetCard[],
		pityTimer?: PityTimer,
		ownedLimitCollectibleCards?: number,
		ownedLimitCollectiblePremiumCards?: number,
	) {
		this.allCards = allCards ? [...allCards] : [];
		this.pityTimer = pityTimer;
		this.ownedLimitCollectibleCards = ownedLimitCollectibleCards || 0;
		this.ownedLimitCollectiblePremiumCards = ownedLimitCollectiblePremiumCards || 0;
	}

	public update(base: Set): Set {
		return Object.assign(
			new Set(
				this.id,
				this.name,
				this.launchDate,
				this.standard,
				this.allCards,
				this.pityTimer,
				this.ownedLimitCollectibleCards,
				this.ownedLimitCollectiblePremiumCards,
			),
			base,
		);
	}

	public getCard(cardId: string): SetCard {
		return this.allCards.find((card) => card.id === cardId);
	}

	numberOfLimitCollectibleCards(): number {
		let totalCards = 0;
		this.allCards.forEach((card: SetCard) => {
			totalCards += card.rarity?.toLowerCase() === 'legendary' ? 1 : 2;
		});
		return totalCards;
	}

	ownedForRarity(rarity: string): number {
		return this.allCards
			.filter((card) => card.rarity?.toLowerCase() === rarity)
			.map((card: SetCard) => card.getNumberCollected())
			.reduce((c1, c2) => c1 + c2, 0);
	}

	totalForRarity(rarity: string): number {
		return this.allCards
			.filter((card) => card.rarity?.toLowerCase() === rarity)
			.map((card: SetCard) => card.getMaxCollectible())
			.reduce((c1, c2) => c1 + c2, 0);
	}
}

export class SetCard {
	readonly id: string;
	readonly name: string;
	readonly cardClass: string;
	readonly rarity: string; // it's all lowercase
	readonly cost: number;
	readonly ownedNonPremium: number = 0;
	readonly ownedPremium: number = 0;
	readonly ownedDiamond: number = 0;
	readonly displayed: boolean = true;
	readonly collectible: boolean = true;

	public static create(base: Partial<NonFunctionProperties<SetCard>>): SetCard {
		return Object.assign(new SetCard(), base);
	}

	constructor(
		id?: string,
		name?: string,
		cardClass?: string,
		rarity?: string,
		cost?: number,
		ownedNonPremium?: number,
		ownedPremium?: number,
		ownedDiamond?: number,
	) {
		this.id = id;
		this.name = name;
		this.cardClass = cardClass ? cardClass.toLowerCase() : cardClass;
		this.rarity = rarity?.toLowerCase();
		this.cost = cost;
		this.ownedNonPremium = ownedNonPremium || 0;
		this.ownedPremium = ownedPremium || 0;
		this.ownedDiamond = ownedDiamond || 0;
	}

	getRegularDustCost(): any {
		switch (this.rarity) {
			case 'common':
				return 40;
			case 'rare':
				return 100;
			case 'epic':
				return 400;
			case 'legendary':
				return 1600;
			default:
				return 0;
		}
	}

	getTotalOwned(): number {
		return this.ownedPremium + this.ownedNonPremium + this.ownedDiamond;
	}

	getNumberCollected(): number {
		return ~~Math.min(this.ownedPremium + this.ownedNonPremium + this.ownedDiamond, this.getMaxCollectible());
	}

	getNumberCollectedPremium(): number {
		return ~~Math.min(this.ownedPremium + this.ownedDiamond, this.getMaxCollectible());
	}

	getMaxCollectible(): number {
		if (!this.rarity) {
			console.warn('missing rarity', this);
		}
		return this.rarity?.toLowerCase() === 'legendary' ? 1 : 2;
	}

	isOwned(): boolean {
		return this.ownedPremium + this.ownedNonPremium + this.ownedDiamond > 0;
	}
}
