import { BattlegroundsState } from '@firestone/game-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsShowPostMatchStatsEvent } from '../events/bgs-show-post-match-stats-event';
import { EventParser } from './_event-parser';

export class BgsShowPostMatchStatsParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsShowPostMatchStatsEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsShowPostMatchStatsEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			forceOpen: true,
			currentPanelId: 'bgs-post-match-stats',
		} as BattlegroundsState);
	}
}
