import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsRecruitStartEvent } from '../events/bgs-recruit-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsRecruitStartParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRecruitStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsRecruitStartEvent): Promise<BattlegroundsState> {
		const newGame = currentState.currentGame.update({
			phase: 'recruit',
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
