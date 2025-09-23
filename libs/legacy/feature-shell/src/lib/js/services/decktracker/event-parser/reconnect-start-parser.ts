import { GameState } from '@firestone/game-state';
import { GameEvent } from '@firestone/game-state';
import { DeckstringOverrideEvent } from '../event/deckstring-override-event';
import { EventParser } from './event-parser';

export class ReconnectStartParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: DeckstringOverrideEvent): Promise<GameState> {
		// In Battlegrounds, when we reconnect, we might miss all the "minions removed" events
		// Also, new events are emitted for all the minions that are still on board
		// So we clean everything
		const newOpponentState = currentState.isBattlegrounds()
			? currentState.opponentDeck.update({
					board: [],
				})
			: currentState.opponentDeck;
		const newBgState = currentState.bgState?.update({
			duoPendingBoards: [],
		});
		return currentState.update({
			reconnectOngoing: true,
			hasReconnected: true,
			opponentDeck: newOpponentState,
			bgState: newBgState,
		});
	}

	event(): string {
		return GameEvent.RECONNECT_START;
	}
}
