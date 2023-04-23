import { RarityTYpe } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '../services/utils';
import { CollectionCardType } from './collection/collection-card-type.type';

export class Set {
	readonly allCards: readonly SetCard[] = [];

	readonly ownedLimitCollectibleCards: number = 0;
	readonly ownedLimitCollectiblePremiumCards: number = 0;

	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly launchDate: Date,
		public readonly standard?: boolean,
		allCards?: readonly SetCard[],
		ownedLimitCollectibleCards?: number,
		ownedLimitCollectiblePremiumCards?: number,
	) {
		this.allCards = allCards ? [...allCards] : [];
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

	getCardsForPremium(premium: CollectionCardType) {
		return this.allCards.filter((card) => card.getMaxOwnedForPremium(premium) > 0);
	}

	ownedForRarity(rarity: RarityTYpe, premium?: CollectionCardType): number {
		const baseCards = !!premium ? this.getCardsForPremium(premium) : this.allCards
		return baseCards
			.filter((card) => card.rarity?.toUpperCase() === rarity?.toUpperCase())
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
	readonly ownedSignature: number = 0;
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
		ownedSignature?: number,
	) {
		this.id = id;
		this.name = name;
		this.cardClass = cardClass ? cardClass.toLowerCase() : cardClass;
		this.rarity = rarity?.toLowerCase();
		this.cost = cost;
		this.ownedNonPremium = ownedNonPremium || 0;
		this.ownedPremium = ownedPremium || 0;
		this.ownedDiamond = ownedDiamond || 0;
		this.ownedSignature = ownedSignature || 0;
	}

	public getOwnedForPremium(premium: CollectionCardType) {
		switch (premium) {
			case 'NORMAL':
				return this.ownedNonPremium;
			case 'GOLDEN':
				return this.ownedPremium;
			case 'DIAMOND':
				return this.ownedDiamond;
			case 'SIGNATURE':
				return this.ownedSignature;
		}
	}
	public getMaxOwnedForPremium(premium: CollectionCardType) {
		const totalOwned = this.getOwnedForPremium(premium);
		return Math.min(totalOwned, this.getMaxCollectible());
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
		return this.ownedPremium + this.ownedNonPremium + this.ownedDiamond + this.ownedSignature;
	}

	getNumberCollected(): number {
		return ~~Math.min(this.getTotalOwned(), this.getMaxCollectible());
	}

	getNumberCollectedPremium(): number {
		return ~~Math.min(this.ownedPremium + this.ownedDiamond + this.ownedSignature, this.getMaxCollectible());
	}

	getMaxCollectible(): number {
		if (!this.rarity) {
			console.warn('missing rarity', this);
		}
		return this.rarity?.toLowerCase() === 'legendary' ? 1 : 2;
	}

	isOwned(): boolean {
		return this.getTotalOwned() > 0;
	}
}
