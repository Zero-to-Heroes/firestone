import { GameEvent, GameStateEvent } from '@firestone/game-state';

export class DeckstringOverrideEvent implements GameStateEvent {
	readonly type: string = GameEvent.DECKSTRING_OVERRIDE;

	constructor(
		public readonly deckName: string,
		public readonly deckstring: string,
		public readonly playerOrOpponent: 'player' | 'opponent',
	) {}
}
