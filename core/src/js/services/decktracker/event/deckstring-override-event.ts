import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';

export class DeckstringOverrideEvent implements GameStateEvent {
	readonly type: string = GameEvent.DECKSTRING_OVERRIDE;

	constructor(
		public readonly deckName: string,
		public readonly deckstring: string,
		public readonly playerOrOpponent: 'player' | 'opponent',
	) {}
}
