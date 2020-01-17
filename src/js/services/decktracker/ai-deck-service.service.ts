import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

const AI_DECKSTRINGS_URL = 'https://static.zerotoheroes.com/hearthstone/data/ai_decks';

@Injectable()
export class AiDeckService {
	private aiDecks: readonly AiDeck[];

	constructor(private readonly http: HttpClient, private readonly logger: NGXLogger) {
		this.init();
	}

	public getAiDeck(opponentCardId: string, scenarioId: number): string {
		if (!this.aiDecks || this.aiDecks.length === 0) {
			this.logger.warn('[ai-decks] decks not initialized yet', opponentCardId, scenarioId);
			return null;
		}
		//  this.logger.log('[ai-decks] getting deck for', opponentCardId, scenarioId, this.aiDecks);
		const deck =
			this.aiDecks.find(deck => deck.opponentCardId === opponentCardId && deck.scenarioId === scenarioId) ||
			this.aiDecks.find(deck => deck.opponentCardId === opponentCardId && deck.scenarioId == null);
		return deck ? deck.deckstring : null;
	}

	private async init() {
		const decksArray = await Promise.all(['innkeeper'].map(fileName => this.loadAiDecks(fileName)));
		this.aiDecks = decksArray.reduce((a, b) => a.concat(b), []);
		// console.log('loaded ai decks', this.aiDecks);
	}

	private async loadAiDecks(fileName: string): Promise<readonly AiDeck[]> {
		return new Promise<readonly AiDeck[]>(resolve => {
			this.http.get(`${AI_DECKSTRINGS_URL}/${fileName}.json`).subscribe(
				(result: any[]) => {
					// this.logger.debug('[ai-decks] retrieved ai deck from CDN', fileName, result);
					resolve(result);
				},
				error => {
					this.logger.error('[ai-decks] could not retrieve ai decks from CDN', fileName, error);
					resolve([]);
				},
			);
		});
	}
}

interface AiDeck {
	readonly opponentCardId: string;
	readonly scenarioId: number;
	readonly deckstring: string;
}
