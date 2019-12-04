import { Injectable } from '@angular/core';
import { decode } from 'deckstrings';
import { GameEvent } from '../../models/game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { MindVisionService } from '../plugins/mind-vision/mind-vision.service';

@Injectable()
export class DeckParserService {
	private readonly deckContentsRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Deck Contents Received(.*)');
	private readonly deckEditOverRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Finished Editing Deck(.*)');

	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');

	public currentDeck: any = {};

	private lastDeckTimestamp;
	private currentBlock: string;

	constructor(private gameEvents: GameEventsEmitterService, private mindVision: MindVisionService) {
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.GAME_END) {
				this.reset();
			}
		});
	}

	public async getCurrentDeck(): Promise<any> {
		if (this.mindVision) {
			const activeDeck = await this.getActiveDeck();
			if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
				console.log('[deck-parser] updating active deck', activeDeck, this.currentDeck);
				this.currentDeck.deck = { cards: this.explodeDecklist(activeDeck.DeckList) };
			}
		}
		// console.log('returning current deck', this.currentDeck);
		return this.currentDeck;
	}

	private async getActiveDeck() {
		return new Promise<any>(resolve => {
			this.getActiveDeckInternal(activeDeck => resolve(activeDeck), 5);
		});
	}

	private async getActiveDeckInternal(callback, retriesLeft = 5) {
		if (retriesLeft <= 0) {
			callback(null);
			return;
		}
		const activeDeck = await this.mindVision.getActiveDeck();
		if (activeDeck == null) {
			setTimeout(() => {
				this.getActiveDeckInternal(callback, retriesLeft - 1);
				return;
			}, 200);
		}
		callback(activeDeck);
		return;
	}

	private explodeDecklist(decklist: number[]): any[] {
		return decklist.map(dbfId => [dbfId, 1]);
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
		console.log('[decks] resetting deck');
	}
}
