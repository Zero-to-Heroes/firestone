import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { Set, SetCard } from '../models/set';

declare var parseCardsText: any;

@Injectable()
export class AllCardsService {

	private readonly ALL_SETS = [
		['core', 'Basic'],
		['expert1', 'Classic'],
		['og', 'Whispers of the Old Gods'],
		['kara', 'One Night in Karazhan'],
		['gangs', 'Mean Streets of Gadgetzan'],
		['ungoro', 'Journey to Un\'Goro'],
		['icecrown', 'Knights of the Frozen Throne'],
	]

	// I can't find anything in the card data that sets these apart
	private readonly NON_COLLECTIBLE_HEROES = [
		'HERO_01', 'HERO_02', 'HERO_03', 'HERO_04', 'HERO_05', 'HERO_06', 'HERO_07', 'HERO_08', 'HERO_09',
	];

	public getStandardSets(): Set[] {
		let standardSets: Set[] = this.ALL_SETS.map((set) => new Set(set[0], set[1]));
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

	public getRarities(setId: string): string[] {
		if (setId === 'core') {
			return ['free'];
		}
		else {
			return ['common', 'rare', 'epic', 'legendary'];
		}
	}
}
