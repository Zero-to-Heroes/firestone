import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class ReconnectStartParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// In Battlegrounds, when we reconnect, we might miss all the "minions removed" events
		// Also, new events are emitted for all the minions that are still on board
		// So we clean everything
		const newOpponentState = isBattlegrounds(currentState.metadata.gameType)
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
