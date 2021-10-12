import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const AI_DECKSTRINGS_URL = 'https://static.zerotoheroes.com/hearthstone/data/ai_decks';

@Injectable()
export class AiDeckService {
	private aiDecks: readonly AiDeck[];

	constructor(private readonly http: HttpClient) {
		this.init();
	}

	public getAiDeck(opponentCardId: string, scenarioId: number): AiDeck {
		if (!this.aiDecks || this.aiDecks.length === 0) {
			console.warn('[ai-decks] decks not initialized yet', opponentCardId, scenarioId);
			return null;
		}

		const deck =
			this.aiDecks.find(
				(deck) =>
					deck.opponentCardId === opponentCardId &&
					deck.scenarioIds &&
					deck.scenarioIds.indexOf(scenarioId) !== -1,
			) || this.aiDecks.find((deck) => deck.opponentCardId === opponentCardId && deck.scenarioIds == null);
		return deck;
	}

	private async init() {
		const deckNames: readonly string[] = await this.getDeckNames();
		const decksArray = await Promise.all(deckNames.map((fileName) => this.loadAiDecks(fileName)));
		this.aiDecks = decksArray.reduce((a, b) => a.concat(b), []);
		console.log('[ai-decks] loaded ai decks', this.aiDecks && this.aiDecks.length);
	}

	private async getDeckNames(): Promise<readonly string[]> {
		return new Promise<readonly string[]>((resolve) => {
			this.http.get(`${AI_DECKSTRINGS_URL}/all_files.json?v=5`).subscribe(
				(result: any[]) => {
					resolve(result);
				},
				(error) => {
					console.error('[ai-decks] could not retrieve ai decks from CDN', error);
					resolve([]);
				},
			);
		});
	}

	private async loadAiDecks(fileName: string): Promise<readonly AiDeck[]> {
		return new Promise<readonly AiDeck[]>((resolve) => {
			this.http.get(`${AI_DECKSTRINGS_URL}/${fileName}.json?v=5`).subscribe(
				(result: any[]) => {
					resolve(result);
				},
				(error) => {
					console.error('[ai-decks] could not retrieve ai decks from CDN', fileName, error);
					resolve([]);
				},
			);
		});
	}
}

interface AiDeck {
	readonly opponentCardId: string;
	readonly scenarioIds: readonly number[];
	readonly deckstring: string;
	readonly decks?: readonly any[];
}
