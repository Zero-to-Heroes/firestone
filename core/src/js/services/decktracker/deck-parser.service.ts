import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { decode } from 'deckstrings';
import { DeckCard } from '../../models/decktracker/deck-card';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';

@Injectable()
export class DeckParserService {
	private readonly goingIntoQueueRegex = new RegExp('D \\d*:\\d*:\\d*.\\d* BeginEffect blur \\d => 1');

	private readonly deckContentsRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Deck Contents Received(.*)');
	private readonly deckEditOverRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Finished Editing Deck(.*)');

	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');

	public currentDeck: any = {};

	private lastDeckTimestamp;
	private currentBlock: string;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private memory: MemoryInspectionService,
		private allCards: AllCardsService,
		private events: Events,
	) {
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.GAME_END) {
				this.reset();
			}
		});
	}

	public async queueingIntoMatch(logLine: string) {
		// console.log('will detect active deck from queue?', logLine);
		if (this.goingIntoQueueRegex.exec(logLine)) {
			// console.log('matching, getting active deck');
			const activeDeck = await this.memory.getActiveDeck(2);
			// console.log('active deck after queue', activeDeck);
			if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
				// console.log('[deck-parser] updating active deck', activeDeck, this.currentDeck);
				this.currentDeck.deck = { cards: this.explodeDecklist(activeDeck.DeckList) };
			}
		}
	}

	public async getCurrentDeck(): Promise<any> {
		if (this.memory) {
			// console.log('[deck-parser] ready to get active deck');
			const activeDeck = await this.memory.getActiveDeck();
			if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
				console.log('[deck-parser] updating active deck', activeDeck, this.currentDeck);
				this.currentDeck.deck = { cards: this.explodeDecklist(activeDeck.DeckList) };
			}
		}
		// console.log('returning current deck', this.currentDeck);
		return this.currentDeck;
	}

	private explodeDecklist(decklist: string[]): any[] {
		// Can be either a dbfId or a cardId, depending on the situation
		return decklist.map(id => [id, 1]);
	}

	public parseActiveDeck(data: string) {
		let match = this.deckContentsRegex.exec(data);
		if (match) {
			this.lastDeckTimestamp = Date.now();
			this.currentBlock = 'DECK_CONTENTS';
			console.log('[decks] finished listing deck content');
			return;
		}
		match = this.deckEditOverRegex.exec(data);
		if (match) {
			this.lastDeckTimestamp = Date.now();
			this.currentBlock = 'DECK_EDIT_OVER';
			console.log('[decks] finished editing deck');
			return;
		}

		if (
			this.lastDeckTimestamp &&
			Date.now() - this.lastDeckTimestamp < 1000 &&
			this.currentBlock !== 'DECK_SLECTED'
		) {
			// console.log('[decks] Doesnt look like a deck selection, exiting block', this.currentBlock);
			this.reset();
			return;
		}

		// console.log('[decks] received log line', data);
		match = this.deckNameRegex.exec(data);
		if (match) {
			// console.log('[decks] matching log line for deck name', data);
			this.currentDeck = {
				name: match[1],
			};
			// console.log('[decks] deck init', this.currentDeck);
			return;
		}
		match = this.deckstringRegex.exec(data);
		if (match) {
			// console.log('[decks] parsing deckstring', match);
			this.currentDeck = this.currentDeck || {};
			this.currentDeck.deckstring = match[1];
			// console.log('[decks] current deck', this.currentDeck);
			this.decodeDeckString();
			// console.log('[decks] deckstring decoded', this.currentDeck);
			return;
		}
	}

	public decodeDeckString() {
		if (this.currentDeck) {
			if (this.currentDeck.deckstring) {
				// console.debug('[decks] deck updated', this.currentDeck);
				const deck = decode(this.currentDeck.deckstring);
				this.currentDeck.deck = deck;
				return;
			} else {
				this.currentDeck.deck = undefined;
			}
		}
	}

	// By doing this we make sure we don't get a leftover deckstring caused by
	// a game mode that doesn't interact with the Decks.log
	public reset() {
		this.currentDeck = {};
		// console.log('[decks] resetting deck');
	}

	public buildDeck(currentDeck: any): readonly DeckCard[] {
		if (currentDeck && currentDeck.deckstring) {
			return this.buildDeckList(currentDeck.deckstring);
		}
		if (!currentDeck || !currentDeck.deck) {
			return [];
		}
		return (
			currentDeck.deck.cards
				// [dbfid, count] pair
				.map(pair => this.buildDeckCards(pair))
				.reduce((a, b) => a.concat(b), [])
				.sort((a: DeckCard, b: DeckCard) => a.manaCost - b.manaCost)
		);
	}

	public buildDeckList(deckstring: string, deckSize = 30): readonly DeckCard[] {
		if (!deckstring) {
			return this.buildEmptyDeckList(deckSize);
		}
		const deck = decode(deckstring);
		// console.log('decoding', deckstring, deck);
		return deck
			? deck.cards
					// [dbfid, count] pair
					.map(pair => this.buildDeckCards(pair))
					.reduce((a, b) => a.concat(b), [])
					.sort((a: DeckCard, b: DeckCard) => a.manaCost - b.manaCost)
			: [];
	}

	public buildEmptyDeckList(deckSize = 30): readonly DeckCard[] {
		return new Array(deckSize).fill(DeckCard.create({} as DeckCard));
	}

	public buildDeckCards(pair): DeckCard[] {
		let dbfId = -1;
		try {
			dbfId = parseInt(pair[0]);
		} catch (e) {}
		const card = dbfId !== -1 ? this.allCards.getCardFromDbfId(dbfId) : this.allCards.getCard(pair[0]);
		const result: DeckCard[] = [];
		if (!card) {
			console.error('Could not build deck card', pair);
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
