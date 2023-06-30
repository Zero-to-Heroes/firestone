import { Injectable } from '@angular/core';
import { CardClass, Race, ReferenceCard, sets, standardSets, twistSets } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

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

	private cachedSets: readonly Set[];

	constructor(private readonly allCards: CardsFacadeService) {}

	public getSetIds(): readonly string[] {
		return sets.map((set) => set.id);
	}

	public getAllSets(): readonly Set[] {
		return this.getSets();
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

		const fragments = searchString.includes(' ') ? searchString.split(' ') : [searchString];
		let nameSearch = searchString;
		let collectibleOnly = true;
		for (const fragment of fragments) {
			if (fragment.includes('text:') && fragment.split('text:')[1]) {
				const textToFind = fragment.split('text:')[1].trim().toLowerCase();
				filterFunctions.push((card) => card.text && card.text.toLowerCase().includes(textToFind));
			}
			if (fragment.includes('name:') && fragment.split('name:')[1]) {
				const textToFind = fragment.split('name:')[1].trim().toLowerCase();
				filterFunctions.push((card) => {
					return card.name && card.name.toLowerCase().includes(textToFind);
				});
			}
			// Include non-collectible
			if (fragment.includes('cards:') && fragment.split('cards:')[1] === 'all') {
				collectibleOnly = false;
				nameSearch = nameSearch.replace(/cards:all\s?/, '');
			}

			// Tribe
			if (fragment.includes('tribe:') && fragment.split('tribe:')[1]) {
				const textToFind = fragment.split('tribe:')[1].trim().toLowerCase();
				filterFunctions.push(
					(card) =>
						card.races?.some((race) => race.toLowerCase().includes(textToFind)) ||
						(Object.values(Race)
							.filter((race) => isNaN(Number(race)))
							.map((r) => r as string)
							.map((r) => r.toLowerCase())
							.includes(textToFind) &&
							card.races?.includes(Race[Race.ALL])),
				);
			}

			if (fragment.includes('cards:') && fragment.split('cards:')[1] === 'extra') {
				filterFunctions.push((card: ReferenceCard) => {
					const collectionCard = collection.find((c) => c.id === card.id);
					if (!collectionCard) {
						return false;
					}
					const maxCollectible = card.rarity === 'Legendary' ? 1 : 2;
					return (
						(collectionCard.count ?? 0) +
							(collectionCard.premiumCount ?? 0) +
							(collectionCard.signatureCount ?? 0) +
							(collectionCard.diamondCount ?? 0) >
						maxCollectible
					);
				});
			}

			if (fragment.includes('-set:') && fragment.split('-set:')[1]) {
				const excludedSetId = fragment.split('-set:')[1].toLowerCase();
				filterFunctions.push((card: ReferenceCard) => !card.set || card.set.toLowerCase() !== excludedSetId);
			}

			if (fragment.includes('-rarity:') && fragment.split('-rarity:')[1]) {
				const rarity = fragment.split('-rarity:')[1].toLowerCase();
				filterFunctions.push((card: ReferenceCard) => !card.rarity || card.rarity.toLowerCase() !== rarity);
			} else if (fragment.includes('rarity:') && fragment.split('rarity:')[1]) {
				const rarity = fragment.split('rarity:')[1].toLowerCase();
				filterFunctions.push((card: ReferenceCard) => card.rarity && card.rarity.toLowerCase() === rarity);
			}
		}
		nameSearch = nameSearch.trim().toLowerCase();
		// Default filtering based on name
		if (filterFunctions.length === 0) {
			filterFunctions.push((card) => card.name && card.name.toLowerCase().includes(nameSearch));
		}

		const basicFiltered = collectibleOnly
			? this.allCards
					.getCards()
					.filter((card) => card.collectible)
					.filter((card) => card.set !== 'Hero_skins')
					.filter((card) => !this.NON_COLLECTIBLE_HEROES.includes(card.id))
			: this.allCards.getCards();
		const result = filterFunctions
			.reduce((data, filterFunction) => {
				return data.filter(filterFunction);
			}, basicFiltered)
			.map((card) => {
				let cardName = card.name;
				if (card.type === 'Hero') {
					cardName += ' (Hero)';
				}
				const rarity = card.rarity ? card.rarity.toLowerCase() : '';
				return new SetCard(card.id, cardName, card.playerClass, rarity, card.cost);
			});
		return result;
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
		return sets.find((set) => set.id === setId)?.name ?? '';
	}

	public getSetFromCardId(cardId: string): Set {
		const card = this.getCard(cardId);
		const setId = card.set.toLowerCase();
		return this.getSet(setId);
	}

	public getSet(setId: string): Set {
		setId = setId.toLowerCase();
		return (
			this.getSets().find((s) => s.id === setId) ?? Set.create({ id: setId, name: setId, launchDate: new Date() })
		);
	}

	private getSets(): readonly Set[] {
		if (this.cachedSets?.length) {
			return this.cachedSets;
		}

		const result: readonly Set[] = sets.map((set) => {
			const setCards = this.getCollectibleSetCards(set.id);
			return Set.create({
				id: set.id,
				name: set.name,
				launchDate: set.launchDate,
				allCards: setCards,
				standard: standardSets.includes(set.id),
				twist: twistSets.includes(set.id),
			});
		});
		this.cachedSets = result;
		return result;
	}

	// Used for pity timers mostly
	public normalizeSetId(setId: string): string {
		switch (setId) {
			case 'maw_and_disorder':
				return 'revendreth';
			case 'darkmoon_races':
				return 'darkmoon_faire';
			case 'wailing_caverns':
				return 'the_barrens';
			case 'deadmines':
				return 'stormwind';
			case 'onyxias_lair':
				return 'alterac_valley';
		}
		return setId;
	}

	private getCollectibleSetCards(setId: string): SetCard[] {
		return this.allCards
			.getCards()
			.filter((card) => card.collectible)
			.filter((card) => card.set)
			.filter((card) => !this.NON_COLLECTIBLE_HEROES.includes(card.id))
			.filter((card) => setId === card.set?.toLowerCase())
			.map(
				(card) =>
					new SetCard(
						card.id,
						card.name,
						card.classes?.map((c) => CardClass[c]) ?? [],
						card.rarity?.toLowerCase(),
						card.cost,
					),
			);
	}
}
