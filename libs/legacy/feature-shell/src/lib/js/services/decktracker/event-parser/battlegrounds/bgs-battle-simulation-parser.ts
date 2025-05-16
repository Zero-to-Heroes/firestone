import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsGame, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsBattleSimulationParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const battleId = gameEvent.additionalData.info.battleId;
		const result = gameEvent.additionalData.info.result;
		const opponentHeroCardId = gameEvent.additionalData.info.heroCardId;
		const intermediateResult = gameEvent.additionalData.info.intermediateResult;

		if (!opponentHeroCardId || !normalizeHeroCardId(opponentHeroCardId, this.allCards)) {
			console.error('[bgs-simulation] missing opponentCardId', event);
		}

		const faceOffToUpdate = currentState.bgState.currentGame.faceOffs.find((f) => f.id === battleId);
		// console.debug('[bgs-simulation] faceOffToUpdate', faceOffToUpdate, currentState.currentGame.faceOffs, event);
		if (!faceOffToUpdate) {
			console.error(
				'[bgs-simulation] could not find face-off',
				battleId,
				currentState.bgState.currentGame.printFaceOffs(),
			);
		}
		const newFaceOff = faceOffToUpdate.update({
			battleResult: result,
			battleInfoStatus: intermediateResult ? 'ongoing' : 'done',
		});
		// console.debug('[bgs-simulation] updating face-off', newFaceOff, currentState.currentGame.faceOffs);
		const newFaceOffs = currentState.bgState.currentGame.faceOffs.map((f) =>
			f.id === newFaceOff.id ? newFaceOff : f,
		);
		// console.debug('[bgs-simulation] new face-offs', newFaceOffs);
		const gameAfterFaceOff: BgsGame = currentState.bgState.currentGame.update({
			faceOffs: newFaceOffs,
		});
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: gameAfterFaceOff,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_BATTLE_SIMULATION;
	}
}
