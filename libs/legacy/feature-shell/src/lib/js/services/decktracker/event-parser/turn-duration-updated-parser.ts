import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class TurnDurationUpdatedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer, entityId] = gameEvent.parse();
		const isPlayer = entityId === localPlayer.Id;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newDeck = deck.update({
			turnDuration: gameEvent.additionalData.newDuration * 1000,
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.TURN_DURATION_UPDATED;
	}
}
