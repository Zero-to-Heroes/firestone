import { Injectable } from '@angular/core';

import { Set, SetCard } from '../models/set';

declare var parseCardsText: any;

@Injectable()
export class AllCardsService {

	private readonly STANDARD_SETS = [
		['core', 'Basic'],
		['expert1', 'Classic'],
		['gilneas', 'The Witchwood'],
		['boomsday', 'The Boomsday Project'],
		['troll', 'Rastakhan\'s Rumble'],
		['dalaran', 'Rise of Shadows'],
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
		['ungoro', 'Journey to Un\'Goro'],
		['icecrown', 'Knights of the Frozen Throne'],
		['lootapalooza', 'Kobolds and Catacombs'],
	]

	// I can't find anything in the card data that sets these apart
	private readonly NON_COLLECTIBLE_HEROES = [
		'HERO_01', 'HERO_02', 'HERO_03', 'HERO_04', 'HERO_05', 'HERO_06', 'HERO_07', 'HERO_08', 'HERO_09',
	];
	
    public getSetIds(): string[] {
		return this.STANDARD_SETS.concat(this.WILD_SETS)
				.map(([setId, setName]) => setId);
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
		}
		else {
			return ['common', 'rare', 'epic', 'legendary'];
		}
	}

	public searchCards(searchString: string): SetCard[] {
        if (!searchString) return [];

        const filterFunctions = [];
        
        const fragments = searchString.indexOf(' ') !== -1
                ? searchString.split(' ')
                : [searchString];
        let nameSearch = searchString;
        let collectibleOnly: boolean = true;
        for (let fragment of fragments) {
            if (fragment.indexOf('text:') !== -1 && fragment.split('text:')[1]) {
                const textToFind = searchString.split('text:')[1];
                filterFunctions.push((card) => card.text && card.text.toLowerCase().indexOf(textToFind.toLowerCase()) !== -1);
            }
            // Include non-collectible
            if (fragment.indexOf('type:') !== -1 && fragment.split('type:')[1] === 'nc') {
                collectibleOnly = false;
                nameSearch = nameSearch.replace(/type:nc\s?/, '');
            }
        }
        nameSearch = nameSearch.trim().toLowerCase();
        // Default filtering based on name
        if (filterFunctions.length === 0) {
            filterFunctions.push((card) => card.name && card.name.toLowerCase().indexOf(nameSearch) != -1);
        }

        const basicFiltered = collectibleOnly 
                ? parseCardsText.jsonDatabase
                        .filter((card) => card.collectible)
                        .filter((card) => card.set != 'Hero_skins')
                        .filter((card) => this.NON_COLLECTIBLE_HEROES.indexOf(card.id) == -1)
                : parseCardsText.jsonDatabase;
        return filterFunctions
                .reduce((data, filterFunction) => data.filter(filterFunction), basicFiltered)
                .map((card) => {
                    let cardName = card.name;
                    if (card.type == 'Hero') {
                        cardName += ' (Hero)';
                    }
                    const rarity = card.rarity ? card.rarity.toLowerCase() : '';
                    return new SetCard(card.id, cardName, card.playerClass, rarity, card.cost)
                });
	}

	public getCard(id: string): any {
		const found = parseCardsText.jsonDatabase
			.find((card) => card.id === id);
		if (!found) {
			console.error('Could not find card in json database ' + id, id);
		}
		return found;
	}

	public getCardFromDbfId(dbfId: number): any {
		return parseCardsText.jsonDatabase
			.find((card) => card.dbfId == dbfId);
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
		const standardSets: Set[] = references.map((set) => new Set(set[0], set[1], isStandard));
		return standardSets.map((set) => {
			const setCards = this.getCollectibleSetCards(set.id);
			return new Set(set.id, set.name, set.standard, setCards);
		});
	}

	private getCollectibleSetCards(setId: string): SetCard[] {
		return parseCardsText.jsonDatabase
			.filter(card => card.collectible)
			.filter(card => card.set)
			.filter(card => this.NON_COLLECTIBLE_HEROES.indexOf(card.id) === -1)
			.filter(card => setId === card.set.toLowerCase())
			.map(card => new SetCard(card.id, card.name, card.playerClass, card.rarity.toLowerCase(), card.cost));
	}
}
