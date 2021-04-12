import { Injectable } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { Card } from '../../models/card';
import { ReferenceSet } from '../../models/collection/reference-set';
import { Set, SetCard } from '../../models/set';
import { CARDS_VERSION } from '../hs-utils';
import { sets, standardSets } from './sets.ref';

@Injectable()
export class SetsService {
	// I can't find anything in the card data that sets these apart
	private readonly NON_COLLECTIBLE_HEROES = [
		'HERO_01',
		'HERO_02',
		'HERO_03',
		'HERO_04',
		'HERO_05',
		'HERO_06',
		'HERO_07',
		'HERO_08',
		'HERO_09',
		'HERO_10',
	];

	constructor(private allCards: AllCardsService) {
		// We don't call it in the constructor because we want the app to be in control
		// of how they load the cards, and for it to be aware of when cards have been loaded
		// this.retrieveAllCards();
	}

	public async initializeCardsDb(): Promise<void> {
		return this.allCards.initializeCardsDb(CARDS_VERSION);
	}

	public getSetIds(): string[] {
		return sets.map(set => set.id);
	}

	public getStandardSets(): Set[] {
		return this.getSets(
			sets.filter(set => standardSets.includes(set.id)),
			true,
		);
	}

	public getWildSets(): Set[] {
		return this.getSets(
			sets.filter(set => !standardSets.includes(set.id)),
			false,
		);
	}

	public getAllSets(): Set[] {
		return this.getStandardSets().concat(this.getWildSets());
	}

	public getAllCards(): ReferenceCard[] {
		return this.allCards.getCards();
	}

	public getRarities(setId: string): string[] {
		if (setId === 'core') {
			return ['free'];
		} else {
			return ['common', 'rare', 'epic', 'legendary'];
		}
	}

	public searchCards(searchString: string, collection: readonly Card[]): SetCard[] {
		if (!searchString) {
			return [];
		}

		searchString = searchString.trim();

		// Shortcut
		if (searchString.includes('extra')) {
			searchString = searchString.replace('extra', 'cards:extra -set:legacy -set:vanilla -set:core -rarity:free');
		}

		const filterFunctions = [];

		const fragments = searchString.indexOf(' ') !== -1 ? searchString.split(' ') : [searchString];
		let nameSearch = searchString;
		let collectibleOnly = true;
		for (const fragment of fragments) {
			console.debug('processing fragment', fragment);
			if (fragment.indexOf('text:') !== -1 && fragment.split('text:')[1]) {
				const textToFind = searchString.split('text:')[1];
				filterFunctions.push(
					card => card.text && card.text.toLowerCase().indexOf(textToFind.toLowerCase()) !== -1,
				);
			}
			if (fragment.indexOf('name:') !== -1 && fragment.split('name:')[1]) {
				const textToFind = searchString.split('name:')[1];
				filterFunctions.push(
					card => card.name && card.name.toLowerCase().indexOf(textToFind.toLowerCase()) === -1,
				);
			}
			// Include non-collectible
			if (fragment.indexOf('cards:') !== -1 && fragment.split('cards:')[1] === 'all') {
				collectibleOnly = false;
				nameSearch = nameSearch.replace(/cards:all\s?/, '');
			}

			if (fragment.indexOf('cards:') !== -1 && fragment.split('cards:')[1] === 'extra') {
				filterFunctions.push((card: ReferenceCard) => {
					const collectionCard = collection.find(c => c.id === card.id);
					if (!collectionCard) {
						return false;
					}
					const maxCollectible = card.rarity === 'Legendary' ? 1 : 2;
					return (
						(collectionCard.count ?? 0) +
							(collectionCard.premiumCount ?? 0) +
							(collectionCard.diamondCount ?? 0) >
						maxCollectible
					);
				});
			}

			if (fragment.indexOf('-set:') !== -1 && fragment.split('-set:')[1]) {
				const excludedSetId = fragment.split('-set:')[1].toLowerCase();
				filterFunctions.push((card: ReferenceCard) => !card.set || card.set.toLowerCase() !== excludedSetId);
			}

			if (fragment.indexOf('-rarity:') !== -1 && fragment.split('-rarity:')[1]) {
				const rarity = fragment.split('-rarity:')[1].toLowerCase();
				filterFunctions.push((card: ReferenceCard) => !card.rarity || card.rarity.toLowerCase() !== rarity);
				console.debug('added -rarity function', filterFunctions, rarity);
			} else if (fragment.indexOf('rarity:') !== -1 && fragment.split('rarity:')[1]) {
				const rarity = fragment.split('rarity:')[1].toLowerCase();
				filterFunctions.push((card: ReferenceCard) => card.rarity && card.rarity.toLowerCase() === rarity);
			}
		}
		nameSearch = nameSearch.trim().toLowerCase();
		// Default filtering based on name
		if (filterFunctions.length === 0) {
			filterFunctions.push(card => card.name && card.name.toLowerCase().indexOf(nameSearch) !== -1);
		}

		const basicFiltered = collectibleOnly
			? this.allCards
					.getCards()
					.filter(card => card.collectible)
					.filter(card => card.set !== 'Hero_skins')
					.filter(card => this.NON_COLLECTIBLE_HEROES.indexOf(card.id) === -1)
			: this.allCards.getCards();
		return filterFunctions
			.reduce((data, filterFunction) => data.filter(filterFunction), basicFiltered)
			.map(card => {
				let cardName = card.name;
				if (card.type === 'Hero') {
					cardName += ' (Hero)';
				}
				const rarity = card.rarity ? card.rarity.toLowerCase() : '';
				return new SetCard(card.id, cardName, card.playerClass, rarity, card.cost);
			});
	}

	public getCard(id: string): ReferenceCard {
		return this.allCards.getCard(id);
	}

	public getCardFromDbfId(dbfId: number): ReferenceCard {
		return this.allCards.getCardFromDbfId(+dbfId);
	}

	public getCardsFromDbfIds(dbfIds: number[]): ReferenceCard[] {
		return this.allCards.getCardsFromDbfIds(dbfIds);
	}

	public setName(setId: string): string {
		if (!setId) {
			return '';
		}

		setId = setId.toLowerCase();
		return sets.find(set => set.id === setId)?.name ?? '';
	}

	public getSetFromCardId(cardId: string): Set {
		const card = this.getCard(cardId);
		const setId = card.set.toLowerCase();
		return this.getSet(setId);
	}

	public getSet(setId: string): Set {
		setId = setId.toLowerCase();
		for (const theSet of this.getStandardSets()) {
			if (theSet.id === setId) {
				return theSet;
			}
		}
		for (const theSet of this.getWildSets()) {
			if (theSet.id === setId) {
				return theSet;
			}
		}
		console.error('[sets-service] incorrect call to getSet', setId);
		return new Set(setId, setId, new Date());
	}

	private getSets(references: readonly ReferenceSet[], isStandard: boolean): Set[] {
		const referenceSets: Set[] = references.map(set => new Set(set.id, set.name, set.launchDate, isStandard));
		return referenceSets.map(set => {
			const setCards = this.getCollectibleSetCards(set.id);
			return new Set(set.id, set.name, set.launchDate, set.standard, setCards);
		});
	}

	private getCollectibleSetCards(setId: string): SetCard[] {
		return this.allCards
			.getCards()
			.filter(card => card.collectible)
			.filter(card => card.set)
			.filter(card => this.NON_COLLECTIBLE_HEROES.indexOf(card.id) === -1)
			.filter(card => setId === card.set?.toLowerCase())
			.map(card => new SetCard(card.id, card.name, card.playerClass, card.rarity?.toLowerCase(), card.cost));
	}
}
