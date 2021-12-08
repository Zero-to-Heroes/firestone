import { Injectable } from '@angular/core';
import { Board, CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { decode, encode } from 'deckstrings';
import { DeckCard } from '../../models/decktracker/deck-card';
import { MatchInfo } from '../../models/match-info';
import { getDefaultHeroDbfIdForClass } from '../hs-utils';
import { LocalizationFacadeService } from '../localization-facade.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';

@Injectable()
export class DeckHandlerService {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly memory: MemoryInspectionService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public buildDeckList(deckstring: string, deckSize = 30): readonly DeckCard[] {
		if (!deckstring) {
			return this.buildEmptyDeckList(deckSize);
		}

		const deck = decode(deckstring);
		return deck
			? deck.cards
					// [dbfid, count] pair
					.map((pair) => this.buildDeckCards(pair))
					.reduce((a, b) => a.concat(b), [])
					.sort((a: DeckCard, b: DeckCard) => a.manaCost - b.manaCost)
			: [];
	}

	public buildEmptyDeckList(deckSize = 30): readonly DeckCard[] {
		return new Array(deckSize).fill(DeckCard.create({} as DeckCard));
	}

	public buildDeckCards(pair): DeckCard[] {
		const dbfId = +pair[0];
		const card = !isNaN(dbfId) ? this.allCards.getCardFromDbfId(dbfId) : this.allCards.getCard(pair[0]);
		const result: DeckCard[] = [];
		if (!card) {
			console.warn('Could not build deck card', dbfId, isNaN(dbfId), dbfId !== -1, pair);
			return result;
		}
		// Don't include passive buffs in the decklist
		if (card.mechanics && card.mechanics.indexOf('DUNGEON_PASSIVE_BUFF') !== -1) {
			return result;
		}
		for (let i = 0; i < pair[1]; i++) {
			result.push(
				DeckCard.create({
					cardId: card.id,
					cardName: this.i18n.getCardName(card.id),
					manaCost: card.cost,
					rarity: card.rarity ? card.rarity.toLowerCase() : null,
				} as DeckCard),
			);
		}
		return result;
	}

	public async postProcessDeck(deck: readonly DeckCard[]): Promise<readonly DeckCard[]> {
		if (!deck || deck.length === 0) {
			return deck;
		}

		const matchInfo = await this.memory.getMatchInfo();
		return deck.map((decKCard) => this.postProcessDeckCard(decKCard, matchInfo));
	}

	private postProcessDeckCard(deckCard: DeckCard, matchInfo: MatchInfo): DeckCard {
		const newCardId = this.updateCardId(deckCard.cardId, matchInfo);
		if (newCardId === deckCard.cardId) {
			return deckCard;
		}
		const newCard = this.allCards.getCard(newCardId);
		return deckCard.update({
			cardId: newCard.id,
			cardName: this.i18n.getCardName(newCard.id),
		} as DeckCard);
	}

	public normalizeDeckstring(deckstring: string, heroCardId?: string): string {
		try {
			const deck = decode(deckstring);
			deck.heroes = deck.heroes?.map((heroDbfId) => this.normalizeHero(heroDbfId, heroCardId));
			const newDeckstring = encode(deck);
			return newDeckstring;
		} catch (e) {
			if (deckstring) {
				console.warn('trying to normalize invalid deckstring', deckstring, e);
			}
			return deckstring;
		}
	}

	private updateCardId(cardId: string, matchInfo: MatchInfo): string {
		if (cardId !== CardIds.TransferStudent || !matchInfo) {
			return cardId;
		}

		// Don't use generated card ids here, as they are changing all the time
		switch (matchInfo.boardId) {
			case Board.STORMWIND:
				return 'SCH_199t';
			case Board.ORGRIMMAR:
				return 'SCH_199t2';
			case Board.PANDARIA:
				return 'SCH_199t3';
			case Board.STRANGLETHORN:
				return 'SCH_199t4';
			case Board.NAXXRAMAS:
				return 'SCH_199t5';
			case Board.GOBLINS_VS_GNOMES:
				return 'SCH_199t6';
			case Board.BLACKROCK_MOUNTAIN:
				return 'SCH_199t7';
			case Board.THE_GRAND_TOURNAMENT:
				return 'SCH_199t8';
			case Board.THE_MUSEUM:
				return 'SCH_199t9';
			case Board.EXCAVATION_SITE:
				return 'SCH_199t24';
			case Board.STORMWIND_OLD_GODS:
				return 'SCH_199t10';
			case Board.KARAZHAN:
				return 'SCH_199t11';
			case Board.MEAN_STREETS_OF_GADGETZAN:
				return 'SCH_199t12';
			case Board.UNGORO:
				return 'SCH_199t13';
			case Board.FROZEN_THRONE:
				return 'SCH_199t14';
			case Board.KOBOLDS_AND_CATACOMBS:
				return 'SCH_199t15';
			case Board.THE_WITCHWOOD:
				return 'SCH_199t16';
			case Board.BOOMSDAY:
				return 'SCH_199t17';
			case Board.RASTAKHANS_RUMBLE:
				return 'SCH_199t18';
			case Board.DALARAN:
				return 'SCH_199t19';
			case Board.SAVIORS_OF_ULDUM:
				return 'SCH_199t20';
			case Board.SAVIORS_OF_ULDUM_ALT:
				return 'SCH_199t25';
			case Board.DRAGONS:
				return 'SCH_199t21';
			case Board.ASHES_OF_OUTLANDS:
				return 'SCH_199t22';
			case Board.SCHOLOMANCE:
				return 'SCH_199t23';
			case Board.DARKMOON_FAIRE:
				return 'SCH_199t26';
			case Board.BARRENS:
				return 'SCH_199t27';
			case Board.STORMWIND_2:
				return 'SCH_199t28';
			case Board.ALTERAC:
				return 'SCH_199t29';
			default:
				return cardId;
		}
	}

	public normalizeHero(heroDbfId: number, heroCardId?: string): number {
		let card: ReferenceCard;

		if (heroDbfId) {
			card = this.allCards.getCardFromDbfId(+heroDbfId);
		}

		if (!card || !card.id) {
			card = this.allCards.getCard(heroCardId);
			if (!card || !card.id) {
				return heroDbfId;
			}
		}

		const playerClass: string = this.allCards.getCard(card.id)?.playerClass;
		return getDefaultHeroDbfIdForClass(playerClass);
	}
}
