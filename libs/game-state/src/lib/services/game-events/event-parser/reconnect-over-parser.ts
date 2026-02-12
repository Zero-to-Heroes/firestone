import { GameState } from '../../../models/game-state';
import { DeckHandlerService } from '../../deck-handler.service';
import { ConstructedArchetypeServiceOrchestrator } from '../../deck/constructed-archetype-orchestrator.service';
import { DeckstringOverrideEvent } from '../../game-state-events/deckstring-override-event';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckstringOverrideParser } from './deckstring-override-parser';

export class ReconnectOverParser implements EventParser {
	constructor(
		private readonly deckHandler: DeckHandlerService,
		private readonly constructedArchetypes: ConstructedArchetypeServiceOrchestrator,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const stateAfterPlayerDeckUpdate = await new DeckstringOverrideParser(
			this.deckHandler,
			this.constructedArchetypes,
		).parse(
			currentState,
			new DeckstringOverrideEvent(currentState.playerDeck.name!, currentState.playerDeck.deckstring!, 'player'),
		);
		const stateAfterOpponentDeckUpdate = await new DeckstringOverrideParser(
			this.deckHandler,
			this.constructedArchetypes,
		).parse(
			stateAfterPlayerDeckUpdate,
			new DeckstringOverrideEvent(
				stateAfterPlayerDeckUpdate.opponentDeck.name!,
				stateAfterPlayerDeckUpdate.opponentDeck.deckstring!,
				'opponent',
			),
		);
		const result = stateAfterOpponentDeckUpdate.update({
			// mulliganOver: true,
			reconnectOngoing: false,
		} as GameState);
		return result;
	}

	event(): string {
		return GameEvent.RECONNECT_OVER;
	}
}
