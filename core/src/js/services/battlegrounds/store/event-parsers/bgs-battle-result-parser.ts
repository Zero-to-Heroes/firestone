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
		const newGame = currentState.currentGame.update({
			faceOffs: [...currentState.currentGame.faceOffs, faceOff] as readonly BgsFaceOff[],
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
