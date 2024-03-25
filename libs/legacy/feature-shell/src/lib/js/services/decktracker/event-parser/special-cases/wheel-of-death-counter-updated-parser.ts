import { DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

export class WheelOfDeathCounterUpdatedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newPlayerDeck = deck.update({
			wheelOfDeathCounter: gameEvent.additionalData.turnsBeforeControllerDies,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.WHEEL_OF_DEATH_COUNTER_UPDATED;
	}
}
