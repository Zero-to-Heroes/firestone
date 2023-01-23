import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BattlegroundsBattleSimulationEvent } from '../events/battlegrounds-battle-simulation-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleSimulationParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BattlegroundsBattleSimulationEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BattlegroundsBattleSimulationEvent,
	): Promise<BattlegroundsState> {
		if (!event.opponentHeroCardId || !normalizeHeroCardId(event.opponentHeroCardId, this.allCards)) {
			console.error('[bgs-battle-simulation] missing opponentCardId', event);
		}

		const faceOffToUpdate = currentState.currentGame.faceOffs.find((f) => f.id === event.battleId);
		if (!faceOffToUpdate) {
			console.error(
				'[bgs-battle-simulation] could not find face-off',
				event.battleId,
				currentState.currentGame.printFaceOffs(),
			);
		}
		const newFaceOff = faceOffToUpdate.update({
			battleResult: event.result,
			battleInfoStatus: 'done',
		});
		const newFaceOffs = currentState.currentGame.faceOffs.map((f) => (f.id === newFaceOff.id ? newFaceOff : f));
		const gameAfterFaceOff: BgsGame = currentState.currentGame.update({
			faceOffs: newFaceOffs,
		});
		return currentState.update({
			currentGame: gameAfterFaceOff,
		} as BattlegroundsState);
	}
}
