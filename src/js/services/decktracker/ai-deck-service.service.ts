import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

const AI_DECKSTRINGS_URL = 'https://static.zerotoheroes.com/hearthstone/data/ai_deckstrings.json';

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
		return null;
		this.logger.log('[ai-decks] getting deck for', opponentCardId, scenarioId);
		const deck = this.aiDecks.find(
			deck => deck.opponentCardId === opponentCardId && deck.scenarioId === scenarioId,
		);
		return deck ? deck.deckstring : null;
	}

	private async init() {
		this.http.get(AI_DECKSTRINGS_URL).subscribe(
			(result: any[]) => {
				this.logger.debug('[ai-decks] retrieved ai decks info from CDN');
				this.aiDecks = result;
			},
			error => {
				this.logger.debug('[ai-decks] could not retrieve aai decks info from CDN', error);
			},
		);
	}
}

interface AiDeck {
	readonly opponentCardId: string;
	readonly scenarioId: number;
	readonly deckstring: string;
}
