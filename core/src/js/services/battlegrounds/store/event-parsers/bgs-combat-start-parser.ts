import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsCombatStartEvent } from '../events/bgs-combat-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsCombatStartParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsCombatStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsCombatStartEvent): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame.update({
				battleInfoStatus: 'waiting-for-result',
			} as BgsGame),
		} as BattlegroundsState);
	}
}
