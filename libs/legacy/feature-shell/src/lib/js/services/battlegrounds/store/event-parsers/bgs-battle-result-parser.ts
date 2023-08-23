import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
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
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBattleResultEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsBattleResultEvent): Promise<BattlegroundsState> {
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
		newFaceOff.checkIntegrity(gameAfterFirstFaceOff);
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
