import { BattlegroundsState, BgsGame } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsStartComputingPostMatchStatsEvent } from '../events/bgs-start-computing-post-match-stats-event';
import { EventParser } from './_event-parser';

export class BgsStartComputingPostMatchStatsParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsStartComputingPostMatchStatsEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsStartComputingPostMatchStatsEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			forceOpen: false, // prefs.bgsEnableApp && prefs.bgsForceShowPostMatchStats && prefs.bgsFullToggle ? true : false,
			currentGame: currentState.currentGame.update({
				gameEnded: true,
				// replayXml: event.replayXml,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
