import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { NoBgsMatchEvent } from '../events/no-bgs-match-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class NoBgsMatchParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'NoBgsMatchEvent';
	}

	public async parse(currentState: BattlegroundsState, event: NoBgsMatchEvent): Promise<BattlegroundsState> {
		return BattlegroundsState.create({
			// globalStats: currentState.globalStats,
		} as BattlegroundsState);
	}
}
