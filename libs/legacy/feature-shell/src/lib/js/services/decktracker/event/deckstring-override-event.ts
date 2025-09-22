import { GameStateEvent } from '@firestone/app/common';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';

export class DeckstringOverrideEvent implements GameStateEvent {
	readonly type: string = GameEvent.DECKSTRING_OVERRIDE;

	constructor(
		public readonly deckName: string,
		public readonly deckstring: string,
		public readonly playerOrOpponent: 'player' | 'opponent',
	) {}
}
