import { Injectable } from '@angular/core';

import { Set, SetCard } from '../models/set';

declare var parseCardsText: any;

@Injectable()
export class AllCardsService {

	private readonly STANDARD_SETS = [
		['core', 'Basic'],
		['expert1', 'Classic'],
		['ungoro', 'Journey to Un\'Goro'],
		['icecrown', 'Knights of the Frozen Throne'],
		['lootapalooza', 'Kobolds and Catacombs'],
		['gilneas', 'The Witchwood'],
		['boomsday', 'The Boomsday Project'],
	]

	private readonly WILD_SETS = [
		['naxx', 'Naxxramas'],
		['gvg', 'Goblins vs Gnomes'],
		['brm', 'Blackrock Mountain'],
		['tgt', 'The Grand Tournament'],
		['loe', 'League of Explorers'],
		['hof', 'Hall of Fame'],
		['og', 'Whispers of the Old Gods'],
		['kara', 'One Night in Karazhan'],
		['gangs', 'Mean Streets of Gadgetzan'],
	]

	// I can't find anything in the card data that sets these apart
	private readonly NON_COLLECTIBLE_HEROES = [
		'HERO_01', 'HERO_02', 'HERO_03', 'HERO_04', 'HERO_05', 'HERO_06', 'HERO_07', 'HERO_08', 'HERO_09',
	];

	public getStandardSets(): Set[] {
		return this.getSets(this.STANDARD_SETS, true);
	}

	public getWildSets(): Set[] {
		return this.getSets(this.WILD_SETS, false);
	}

	public getRarities(setId: string): string[] {
		if (setId === 'core') {
			return ['free'];
		}
		else {
			return ['common', 'rare', 'epic', 'legendary'];
		}
	}

	public searchCards(searchString: string): SetCard[] {
		if (!searchString) return [];

		return parseCardsText.jsonDatabase
			.filter((card) => card.collectible)
			.filter((card) => card.set != 'Hero_skins')
			.filter((card) => card.name)
			.filter((card) => card.name.toLowerCase().indexOf(searchString.toLowerCase()) != -1)
			.map((card) => new SetCard(card.id, card.name, card.rarity.toLowerCase()));
	}

	public getCard(id: string): any {
		return parseCardsText.jsonDatabase
			.filter((card) => card.id == id)[0];
	}

	public setName(setId: string) {
		setId = setId.toLowerCase();
		for (let i = 0; i < this.STANDARD_SETS.length; i++) {
			if (setId == this.STANDARD_SETS[i][0]) {
				return this.STANDARD_SETS[i][1];
			}
		}
		for (let i = 0; i < this.WILD_SETS.length; i++) {
			if (setId == this.WILD_SETS[i][0]) {
				return this.WILD_SETS[i][1];
			}
		}
		return '';
	}

	public getSetFromCardId(cardId: string) {
		let card = this.getCard(cardId);
		let setId = card.set.toLowerCase();
		return this.getSet(setId);
	}

	public getSet(setId: string) {
		setId = setId.toLowerCase();
		for (let theSet of this.getStandardSets()) {
			if (theSet.id == setId) {
				return theSet;
			}
		}
		for (let theSet of this.getWildSets()) {
			if (theSet.id == setId) {
				return theSet;
			}
		}
		return new Set(setId, setId, true);
	}

	private getSets(references, isStandard: boolean): Set[] {
		let standardSets: Set[] = references.map((set) => new Set(set[0], set[1], isStandard));
		parseCardsText.jsonDatabase.forEach((card) => {
			let elligible = card.collectible;
			elligible = elligible && card.set;
			elligible = elligible && this.NON_COLLECTIBLE_HEROES.indexOf(card.id) === -1;

			if (!elligible) return;

			let set: Set = standardSets.find((set) => set.id === card.set.toLowerCase());
			if (!set) return;

			let setCard: SetCard = new SetCard(card.id, card.name, card.rarity.toLowerCase());
			set.allCards.push(setCard);
		})
		return standardSets;
	}
}
