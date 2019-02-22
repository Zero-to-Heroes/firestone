import { Injectable } from '@angular/core';

import { decode } from 'deckstrings';

@Injectable()
export class DeckParserService {

	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');

	public currentDeck: any = {};

	public parseActiveDeck(data: string) {
		// console.log('[decks] received log line', data);
		let match = this.deckNameRegex.exec(data);
		if (match) {
			this.currentDeck = {
				name: match[1]
			};
			console.log('[decks] deck init', this.currentDeck);
			return;
		}
		match = this.deckstringRegex.exec(data);
		if (match) {
			this.currentDeck.deckstring = match[1];
			console.log('[decks] deck updated', this.currentDeck);
			const deck = decode(this.currentDeck.deckstring);
			console.log('[decks] deck decoded', deck);
			this.currentDeck.deck = deck;
			return;
		}
	}

	// By doing this we make sure we don't get a leftover deckstring caused by 
	// a game mode that doesn't interact with the Decks.log
	public reset() {
		this.currentDeck = {};
	}
}
