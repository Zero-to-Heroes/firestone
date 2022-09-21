import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { ChoosingOptionsGameEvent } from '../../../models/mainwindow/game-events/choosing-options-game-event';
import { EventParser } from './event-parser';

export class ChoosingOptionsParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CHOOSING_OPTIONS;
	}

	async parse(currentState: GameState, gameEvent: ChoosingOptionsGameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newDeck = deck.update({
			currentOptions: gameEvent.additionalData.options.map((o) => {
				return {
					entityId: o.EntityId,
					cardId: o.CardId,
				};
			}),
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.CHOOSING_OPTIONS;
	}
}
