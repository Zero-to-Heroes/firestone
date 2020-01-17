import { DeckState } from './deck-state';
import { Metadata } from './metadata';

export class GameState {
	readonly playerDeck: DeckState = new DeckState();
	readonly opponentDeck: DeckState = new DeckState();
	readonly mulliganOver: boolean = false;
	readonly metadata: Metadata = new Metadata();
	readonly currentTurn: number | 'mulligan' = 'mulligan';
	readonly gameStarted: boolean;

	public static create(): GameState {
		return Object.assign(new GameState());
	}

	public update(value: GameState): GameState {
		return Object.assign(new GameState(), this, value);
	}
}
