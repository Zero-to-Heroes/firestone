import { DeckState } from './deck-state';
import { Metadata } from './metadata';

export class GameState {
	readonly playerDeck: DeckState = new DeckState();
	readonly opponentDeck: DeckState = new DeckState();
	readonly mulliganOver: boolean = false;
	readonly metadata: Metadata = new Metadata();
}
