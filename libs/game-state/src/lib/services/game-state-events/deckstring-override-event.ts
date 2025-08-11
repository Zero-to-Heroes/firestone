import { GameEvent } from '../game-events/game-event';
import { GameStateEvent } from './game-state-event';

export class DeckstringOverrideEvent implements GameStateEvent {
	readonly type: string = GameEvent.DECKSTRING_OVERRIDE;

	constructor(
		public readonly deckName: string | undefined,
		public readonly deckstring: string,
		public readonly playerOrOpponent: 'player' | 'opponent',
	) {}
}
