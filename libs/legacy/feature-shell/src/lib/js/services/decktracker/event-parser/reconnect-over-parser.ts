import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckHandlerService } from '../deck-handler.service';
import { DeckstringOverrideEvent } from '../event/deckstring-override-event';
import { DeckstringOverrideParser } from './deckstring-override-parser';
import { EventParser } from './event-parser';

export class ReconnectOverParser implements EventParser {
	constructor(private readonly deckHandler: DeckHandlerService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: DeckstringOverrideEvent): Promise<GameState> {
		const stateAfterPlayerDeckUpdate = await new DeckstringOverrideParser(this.deckHandler).parse(
			currentState,
			new DeckstringOverrideEvent(currentState.playerDeck.name, currentState.playerDeck.deckstring, 'player'),
		);
		const stateAfterOpponentDeckUpdate = await new DeckstringOverrideParser(this.deckHandler).parse(
			stateAfterPlayerDeckUpdate,
			new DeckstringOverrideEvent(
				stateAfterPlayerDeckUpdate.opponentDeck.name,
				stateAfterPlayerDeckUpdate.opponentDeck.deckstring,
				'opponent',
			),
		);
		const result = stateAfterOpponentDeckUpdate.update({
			mulliganOver: true,
			reconnectOngoing: false,
		} as GameState);
		return result;
	}

	event(): string {
		return GameEvent.RECONNECT_OVER;
	}
}
