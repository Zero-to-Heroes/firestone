import { Injectable } from '@angular/core';

import { decode } from 'deckstrings';
import { GameEvents } from '../game-events.service';
import { GameEvent } from '../../models/game-event';

@Injectable()
export class DeckParserService {

    private readonly deckContentsRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Deck Contents Received(.*)');
    private readonly deckEditOverRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Finished Editing Deck(.*)');
    
	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');

    public currentDeck: any = {};
    
    private lastDeckTimestamp;
    private currentBlock: string;

	constructor(private gameEvents: GameEvents) { 
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.GAME_END) {
				this.reset();
			}
		})
	}

	public parseActiveDeck(data: string) {
        let match = this.deckContentsRegex.exec(data);
		if (match) {
            this.lastDeckTimestamp = Date.now();
            this.currentBlock = "DECK_CONTENTS";
            console.log('[decks] finished listing deck content');
            return;
        }
        match = this.deckEditOverRegex.exec(data);
		if (match) {
            this.lastDeckTimestamp = Date.now();
            this.currentBlock = "DECK_EDIT_OVER";
            console.log('[decks] finished editing deck');
            return;
        }

        if (this.lastDeckTimestamp && (Date.now() - this.lastDeckTimestamp) < 1000 && this.currentBlock !== 'DECK_SLECTED') {
            console.log('[decks] Doesnt look like a deck selection, exiting block', this.currentBlock);
            this.reset();
            return;
        }

		// console.log('[decks] received log line', data);
		match = this.deckNameRegex.exec(data);
		if (match) {
            console.log('[decks] matching log line for deck name', data);
			this.currentDeck = {
				name: match[1]
			};
			console.log('[decks] deck init', this.currentDeck);
			return;
		}
		match = this.deckstringRegex.exec(data);
		if (match) {
            this.currentDeck.deckstring = match[1];
            this.decodeDeckString();
            return;
		}
	}

	public decodeDeckString() {
		// console.log('[decks] deck updated', this.currentDeck);
		const deck = decode(this.currentDeck.deckstring);
		console.log('[decks] deck decoded', deck);
		this.currentDeck.deck = deck;
		return;
	}

	// By doing this we make sure we don't get a leftover deckstring caused by 
	// a game mode that doesn't interact with the Decks.log
	public reset() {
		this.currentDeck = {};
		// console.log('[decks] resetting deck');
	}
}
