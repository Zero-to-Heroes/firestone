import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { ChoosingOptionsGameEvent } from '../../../models/mainwindow/game-events/choosing-options-game-event';
import { EventParser } from './event-parser';

export class TimewarpTavernEndedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: ChoosingOptionsGameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const opponentDeck = currentState.opponentDeck.update({
			board: [],
		});
		return currentState.update({
			opponentDeck: opponentDeck,
		});
	}

	event(): string {
		return GameEvent.TIMEWARPED_TAVERN_ENDED;
	}
}
