import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { decode } from 'deckstrings';
import { DeckCard } from '../../models/decktracker/deck-card';

@Injectable()
export class DeckHandlerService {
	constructor(private allCards: AllCardsService) {}

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
					cardName: card.name,
					manaCost: card.cost,
					rarity: card.rarity ? card.rarity.toLowerCase() : null,
				} as DeckCard),
			);
		}
		return result;
	}
}
