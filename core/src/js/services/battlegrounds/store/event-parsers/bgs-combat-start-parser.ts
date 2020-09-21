import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsCombatStartEvent } from '../events/bgs-combat-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsCombatStartParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsCombatStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsCombatStartEvent): Promise<BattlegroundsState> {
		console.error('should not call combat parser');
		return currentState;
	}
}
