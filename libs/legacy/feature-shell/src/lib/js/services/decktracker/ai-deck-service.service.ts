import { Injectable } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';

const AI_DECKSTRINGS_URL = 'https://static.zerotoheroes.com/hearthstone/data/ai_decks';

@Injectable()
export class AiDeckService {
	private aiDecks: readonly AiDeck[];

	constructor(private readonly api: ApiRunner) {}

	public async getAiDeck(opponentCardId: string, scenarioId: number): Promise<AiDeck> {
		if (!this.aiDecks || this.aiDecks.length === 0) {
			await this.init();
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
		console.log('[ai-decks] init');
		const deckNames: readonly string[] = await this.getDeckNames();
		const decksArray = await Promise.all(deckNames.map((fileName) => this.loadAiDecks(fileName)));
		this.aiDecks = decksArray.reduce((a, b) => a.concat(b), []);
		console.log('[ai-decks] loaded ai decks', this.aiDecks && this.aiDecks.length);
	}

	private async getDeckNames(): Promise<readonly string[]> {
		return this.api.callGetApi<readonly string[]>(`${AI_DECKSTRINGS_URL}/all_files.json`);
	}

	private async loadAiDecks(fileName: string): Promise<readonly AiDeck[]> {
		return this.api.callGetApi<readonly AiDeck[]>(`${AI_DECKSTRINGS_URL}/${fileName}.json`);
	}
}

interface AiDeck {
	readonly opponentCardId: string;
	readonly scenarioIds: readonly number[];
	readonly deckstring: string;
	readonly decks?: readonly any[];
}
