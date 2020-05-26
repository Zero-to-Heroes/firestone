import { captureEvent } from '@sentry/browser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOff } from '../../../../models/battlegrounds/bgs-face-off';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsBattleResultEvent } from '../events/bgs-battle-result-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleResultParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBattleResultEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsBattleResultEvent): Promise<BattlegroundsState> {
		const faceOff: BgsFaceOff = BgsFaceOff.create({
			turn: currentState.currentGame.currentTurn,
			playerCardId: currentState.currentGame.getMainPlayer().cardId,
			opponentCardId: event.opponentCardId,
			result: event.result,
			damage: event.damage,
		} as BgsFaceOff);
		// Error checks
		if (
			currentState.currentGame.battleResult &&
			currentState.currentGame.battleResult.wonPercent != null &&
			currentState.currentGame.battleResult.wonPercent === 0 &&
			event.result === 'won'
		) {
			console.warn(
				'no-format',
				'Impossible battle victory',
				currentState.currentGame.battleInfo,
				currentState.currentGame.battleResult,
			);
			captureEvent({
				message: 'Impossible battle victory',
				extra: {
					battleInput: JSON.stringify(currentState.currentGame.battleInfo),
					battleResult: JSON.stringify(currentState.currentGame.battleResult),
				},
			});
		}
		if (
			currentState.currentGame.battleResult &&
			currentState.currentGame.battleResult.lostPercent != null &&
			currentState.currentGame.battleResult.lostPercent === 0 &&
			event.result === 'lost'
		) {
			console.warn(
				'no-format',
				'Impossible battle loss',
				currentState.currentGame.battleInfo,
				currentState.currentGame.battleResult,
			);
			captureEvent({
				message: 'Impossible battle loss',
				extra: {
					battleInput: JSON.stringify(currentState.currentGame.battleInfo),
					battleResult: JSON.stringify(currentState.currentGame.battleResult),
				},
			});
		}
		const newGame = currentState.currentGame.update({
			faceOffs: [...currentState.currentGame.faceOffs, faceOff] as readonly BgsFaceOff[],
			battleInfo: undefined,
			// battleResult: undefined,
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
