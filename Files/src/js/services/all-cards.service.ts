import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Set, SetCard } from '../models/set';

const CARDS_CDN_URL = 'https://static.zerotoheroes.com/hearthstone/jsoncards/cards.json';

@Injectable()
export class AllCardsService {
	private readonly STANDARD_SETS = [
		['core', 'Basic'],
		['expert1', 'Classic'],
		['gilneas', 'The Witchwood'],
		['boomsday', 'The Boomsday Project'],
		['troll', "Rastakhan's Rumble"],
		['dalaran', 'Rise of Shadows'],
		['uldum', 'Saviors of Uldum'],
	];

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
		['ungoro', "Journey to Un'Goro"],
		['icecrown', 'Knights of the Frozen Throne'],
		['lootapalooza', 'Kobolds and Catacombs'],
	];

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
	];

	private allCards: any[];

	constructor(private http: HttpClient, private logger: NGXLogger) {
		// We don't call it in the constructor because we want the app to be in control
		// of how they load the cards, and for it to be aware of when cards have been loaded
		// this.retrieveAllCards();
	}

	public async initializeCardsDb(): Promise<void> {
		this.logger.debug('[all-cards] initializing card db');
		return new Promise<void>((resolve, reject) => {
			if (this.allCards) {
				this.logger.debug('[all-cards] already loaded all cards', this.allCards);
				resolve();
				return;
			}
			this.http.get('./cards.json').subscribe(
				(result: any[]) => {
					this.logger.debug('[all-cards] retrieved all cards locally');
					this.allCards = result;
					resolve();
				},
				error => {
					this.logger.debug('[all-cards] Could not retrieve cards locally, getting them from CDN', error);
					this.http.get(CARDS_CDN_URL).subscribe(
						(result: any[]) => {
							this.logger.debug('[all-cards] retrieved all cards from CDN');
							this.allCards = result;
							resolve();
						},
						error => {
							this.logger.debug('[all-cards] Could not retrieve cards from CDN', error);
							reject();
						},
					);
				},
			);
		});
	}

	public getSetIds(): string[] {
		return this.STANDARD_SETS.concat(this.WILD_SETS).map(([setId]) => setId);
	}

	public getStandardSets(): Set[] {
		return this.getSets(this.STANDARD_SETS, true);
	}

	public getWildSets(): Set[] {
		return this.getSets(this.WILD_SETS, false);
	}

	public getAllSets(): Set[] {
		return this.getStandardSets().concat(this.getWildSets());
	}

	public getRarities(setId: string): string[] {
		if (setId === 'core') {
			return ['free'];
		} else {
			return ['common', 'rare', 'epic', 'legendary'];
		}
	}

	public searchCards(searchString: string): SetCard[] {
		if (!searchString) {
			return [];
		}

		const filterFunctions = [];

		const fragments = searchString.indexOf(' ') !== -1 ? searchString.split(' ') : [searchString];
		let nameSearch = searchString;
		let collectibleOnly = true;
		for (const fragment of fragments) {
			if (fragment.indexOf('text:') !== -1 && fragment.split('text:')[1]) {
				const textToFind = searchString.split('text:')[1];
				filterFunctions.push(card => card.text && card.text.toLowerCase().indexOf(textToFind.toLowerCase()) !== -1);
			}
			if (fragment.indexOf('-name:') !== -1 && fragment.split('name:')[1]) {
				const textToFind = searchString.split('name:')[1];
				filterFunctions.push(card => card.name && card.name.toLowerCase().indexOf(textToFind.toLowerCase()) === -1);
			}
			// Include non-collectible
			if (fragment.indexOf('cards:') !== -1 && fragment.split('cards:')[1] === 'all') {
				collectibleOnly = false;
				nameSearch = nameSearch.replace(/cards:all\s?/, '');
			}
		}
		nameSearch = nameSearch.trim().toLowerCase();
		// Default filtering based on name
		if (filterFunctions.length === 0) {
			filterFunctions.push(card => card.name && card.name.toLowerCase().indexOf(nameSearch) !== -1);
		}

		const basicFiltered = collectibleOnly
			? this.allCards
					.filter(card => card.collectible)
					.filter(card => card.set !== 'Hero_skins')
					.filter(card => this.NON_COLLECTIBLE_HEROES.indexOf(card.id) === -1)
			: this.allCards;
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

	public getCard(id: string): any {
		const found = this.allCards.find(card => card.id === id);
		if (!found) {
			console.error('Could not find card in json database', id);
		}
		return found;
	}

	public getCardFromDbfId(dbfId: number): any {
		return this.allCards.find(card => card.dbfId === dbfId);
	}

	public getCardsFromDbfIds(dbfIds: number[]): any[] {
		return this.allCards.filter(card => dbfIds.indexOf(card.dbfId) !== -1);
	}

	public setName(setId: string) {
		setId = setId.toLowerCase();
		for (let i = 0; i < this.STANDARD_SETS.length; i++) {
			if (setId === this.STANDARD_SETS[i][0]) {
				return this.STANDARD_SETS[i][1];
			}
		}
		for (let i = 0; i < this.WILD_SETS.length; i++) {
			if (setId === this.WILD_SETS[i][0]) {
				return this.WILD_SETS[i][1];
			}
		}
		return '';
	}

	public getSetFromCardId(cardId: string) {
		const card = this.getCard(cardId);
		const setId = card.set.toLowerCase();
		return this.getSet(setId);
	}

	public getSet(setId: string) {
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
		return new Set(setId, setId, true);
	}

	private getSets(references, isStandard: boolean): Set[] {
		const standardSets: Set[] = references.map(set => new Set(set[0], set[1], isStandard));
		return standardSets.map(set => {
			const setCards = this.getCollectibleSetCards(set.id);
			return new Set(set.id, set.name, set.standard, setCards);
		});
	}

	private getCollectibleSetCards(setId: string): SetCard[] {
		return this.allCards
			.filter(card => card.collectible)
			.filter(card => card.set)
			.filter(card => this.NON_COLLECTIBLE_HEROES.indexOf(card.id) === -1)
			.filter(card => setId === card.set.toLowerCase())
			.map(card => new SetCard(card.id, card.name, card.playerClass, card.rarity.toLowerCase(), card.cost));
	}
}
