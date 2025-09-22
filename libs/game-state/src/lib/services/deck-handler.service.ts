/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { decode, encode, Sideboard } from '@firestone-hs/deckstrings';
import {
	Board,
	CardIds,
	getDefaultHeroDbfIdForClass,
	normalizeDeckHeroDbfId,
	ReferenceCard,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../models/deck-card';
import { DeckSideboard } from '../models/deck-state';

@Injectable()
export class DeckHandlerService {
	constructor(private readonly allCards: CardsFacadeService) {}

	public buildDeckList(deckstring: string, deckSize = 30): readonly DeckCard[] {
		if (!deckstring) {
			return this.buildEmptyDeckList(deckSize);
		}

		const deck = decode(deckstring);
		const sideboards: readonly DeckSideboard[] = this.convertSideboards(deck.sideboards ?? []);
		return deck
			? deck.cards
					// [dbfid, count] pair
					.map((pair) => this.buildDeckCards(pair, sideboards))
					.reduce((a, b) => a.concat(b), [])
					.sort((a: DeckCard, b: DeckCard) => a.refManaCost - b.refManaCost)
			: [];
	}

	public buildEmptyDeckList(deckSize = 30): readonly DeckCard[] {
		return new Array(deckSize).fill(DeckCard.create({} as DeckCard));
	}

	public buildDeckCards(pair: [number, number], sideboards: readonly DeckSideboard[]): DeckCard[] {
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
			const sideboard = sideboards?.find((s) => s.keyCardId === card.id);
			result.push(
				DeckCard.create({
					cardId: card.id,
					cardName: card.name,
					refManaCost: card.cost,
					rarity: card.rarity ? card.rarity.toLowerCase() : null,
					relatedCardIds: !!sideboard ? sideboard.cards : [],
				} as DeckCard),
			);
		}
		return result;
	}

	public buildSideboards(deckstring: string): readonly DeckSideboard[] | null {
		if (!deckstring?.length) {
			return null;
		}

		try {
			return this.convertSideboards(decode(deckstring)?.sideboards ?? []);
		} catch (e) {
			console.error('could not convert sideboards', deckstring);
			return [];
		}
	}

	public convertSideboards(sideboards: readonly Sideboard[]): readonly DeckSideboard[] {
		return sideboards?.map((s) => {
			return {
				keyCardId: this.allCards.getCard(s.keyCardDbfId).id,
				cards: s.cards.flatMap((pair) => new Array(pair[1]).fill(this.allCards.getCard(pair[0]).id)),
			};
		});
	}

	public async postProcessDeck(deck: readonly DeckCard[], boardId: Board): Promise<readonly DeckCard[]> {
		if (!deck || deck.length === 0) {
			return deck;
		}

		const result = deck.map((decKCard) => this.postProcessDeckCard(decKCard, boardId));
		return result;
	}

	private postProcessDeckCard(deckCard: DeckCard, boardId: Board): DeckCard {
		let newCardId = this.updateCardIdForTransferStudent(deckCard.cardId, boardId);
		// if (newCardId === deckCard.cardId) {
		// 	return deckCard;
		// }
		const newCard = this.allCards.getCard(newCardId);
		let newCost = deckCard.refManaCost;
		if (newCard.id === CardIds.ZilliaxDeluxe3000_TOY_330) {
			const modules = deckCard.relatedCardIds?.map((c) => this.allCards.getCard(c)) ?? [];
			newCost = modules.map((c) => c.cost).reduce((a, b) => (a ?? 0) + (b ?? 0), 0)!;
			// The card ID only changes based on the skin
			newCardId = modules[2]?.id ?? newCardId;
		}
		return deckCard.update({
			cardId: newCardId,
			cardName: newCard.name ?? undefined,
			// Here we update the ref mana cost, because it's Zilliax-like cards for which the reference cost depends on some
			// global info
			refManaCost: newCost,
		});
	}

	/** @deprecated: use allCards.normalizeDeckstring() */
	public normalizeDeckstring(deckstring: string): string {
		try {
			const deck = decode(deckstring);
			deck.heroes = deck.heroes?.map(
				(heroDbfId) => normalizeDeckHeroDbfId(heroDbfId, this.allCards.getService()) ?? 7,
			);
			const newDeckstring = encode(deck);
			return newDeckstring;
		} catch (e) {
			if (deckstring) {
				console.warn('trying to normalize invalid deckstring', deckstring, e);
			}
			return deckstring;
		}
	}

	private updateCardIdForTransferStudent(cardId: string, boardId: Board): string {
		if (cardId !== CardIds.TransferStudent || !boardId) {
			return cardId;
		}

		// Don't use generated card ids here, as they are changing all the time
		switch (boardId) {
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
			case Board.VOYAGE_TO_SUNKEN_CITY:
				return 'SCH_199t30';
			case Board.REVENDRETH:
				return 'SCH_199t31';
			case Board.MARCH_OF_THE_LICH_KING:
				return 'SCH_199t32';
			default:
				return cardId;
		}
	}

	public normalizeHero(heroDbfId: number, heroCardId?: string): number | null {
		let card: ReferenceCard | null = null;

		if (heroDbfId) {
			card = this.allCards.getCardFromDbfId(+heroDbfId);
		}

		if (heroCardId && (!card || !card.id)) {
			card = this.allCards.getCard(heroCardId);
			if (!card || !card.id) {
				return heroDbfId;
			}
		}

		if (card) {
			const playerClass: string = this.allCards.getCard(card.id)?.playerClass;
			return getDefaultHeroDbfIdForClass(playerClass);
		}
		return null;
	}
}
