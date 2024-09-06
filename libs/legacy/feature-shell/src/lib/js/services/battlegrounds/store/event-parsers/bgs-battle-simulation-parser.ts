import { BattlegroundsState, BgsGame } from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BattlegroundsBattleSimulationEvent } from '../events/battlegrounds-battle-simulation-event';
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
			console.error('[bgs-simulation] missing opponentCardId', event);
		}

		const faceOffToUpdate = currentState.currentGame.faceOffs.find((f) => f.id === event.battleId);
		// console.debug('[bgs-simulation] faceOffToUpdate', faceOffToUpdate, currentState.currentGame.faceOffs, event);
		if (!faceOffToUpdate) {
			console.error(
				'[bgs-simulation] could not find face-off',
				event.battleId,
				currentState.currentGame.printFaceOffs(),
			);
		}
		const newFaceOff = faceOffToUpdate.update({
			battleResult: event.result,
			battleInfoStatus: event.intermediateResult ? 'ongoing' : 'done',
		});
		// console.debug('[bgs-simulation] updating face-off', newFaceOff, currentState.currentGame.faceOffs);
		const newFaceOffs = currentState.currentGame.faceOffs.map((f) => (f.id === newFaceOff.id ? newFaceOff : f));
		// console.debug('[bgs-simulation] new face-offs', newFaceOffs);
		const gameAfterFaceOff: BgsGame = currentState.currentGame.update({
			faceOffs: newFaceOffs,
		});
		return currentState.update({
			currentGame: gameAfterFaceOff,
		} as BattlegroundsState);
	}
}
