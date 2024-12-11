import { BattlegroundsState, BgsGame } from '@firestone/battlegrounds/core';
import { GameState } from '@firestone/game-state';
import { BugReportService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { checkIntegrity } from '@legacy-import/src/lib/js/models/battlegrounds/face-off-check';
import { Events } from '../../../events.service';
import { GameEvents } from '../../../game-events.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsBattleResultEvent } from '../events/bgs-battle-result-event';
import { EventParser } from './_event-parser';

export class BgsBattleResultParser implements EventParser {
	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly gameEventsService: GameEvents,
		private readonly bugService: BugReportService,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBattleResultEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsBattleResultEvent,
		gameState: GameState,
	): Promise<BattlegroundsState> {
		if (!currentState.currentGame.getMainPlayer()) {
			if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
				console.warn(
					'[bgs-simulation] Could not find main player in battle result parser',
					currentState.currentGame.players.map((player) => player.cardId),
				);
			}
			return currentState;
		}

		const lastFaceOff = currentState.currentGame.faceOffs[currentState.currentGame.faceOffs.length - 1];
		if (!lastFaceOff) {
			console.error(
				'[missing face-off to assign result to',
				event.opponentCardId,
				event.opponentPlayerId,
				currentState.currentGame.printFaceOffs(),
			);
			return currentState;
		}

		const newFaceOff = lastFaceOff.update({
			result: event.result,
			damage: event.damage,
		});
		const newFaceOffs = currentState.currentGame.faceOffs.map((f) => (f.id === newFaceOff.id ? newFaceOff : f));

		const gameAfterFirstFaceOff: BgsGame = currentState.currentGame.update({
			faceOffs: newFaceOffs,
		});
		checkIntegrity(
			newFaceOff,
			gameAfterFirstFaceOff,
			this.bugService,
			gameState.reconnectOngoing || gameState.hasReconnected,
			gameState.metadata.gameType,
			this.allCards,
		);
		const newGame = gameAfterFirstFaceOff.update({
			lastOpponentCardId: event.opponentCardId,
			lastOpponentPlayerId: event.opponentPlayerId,
		} as BgsGame);
		this.events.broadcast(Events.BATTLE_SIMULATION_HISTORY_UPDATED, newGame);
		console.debug('[bgs-simulation] updating with result and resetting battle info');
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
