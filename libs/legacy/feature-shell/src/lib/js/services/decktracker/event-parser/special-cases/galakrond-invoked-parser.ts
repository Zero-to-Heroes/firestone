import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

export class GalakrondInvokedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.GALAKROND_INVOKED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			galakrondInvokesCount: gameEvent.additionalData.totalInvoke,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.GALAKROND_INVOKED;
	}
}
