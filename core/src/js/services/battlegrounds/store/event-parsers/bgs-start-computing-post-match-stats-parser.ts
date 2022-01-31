import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { PreferencesService } from '../../../preferences.service';
import { BgsStartComputingPostMatchStatsEvent } from '../events/bgs-start-computing-post-match-stats-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsStartComputingPostMatchStatsParser implements EventParser {
	constructor(private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsStartComputingPostMatchStatsEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsStartComputingPostMatchStatsEvent,
	): Promise<BattlegroundsState> {
		// const prefs: Preferences = await this.prefs.getPreferences();
		return currentState.update({
			// currentPanelId: 'bgs-post-match-stats',
			forceOpen: false, // prefs.bgsEnableApp && prefs.bgsForceShowPostMatchStats && prefs.bgsFullToggle ? true : false,
			currentGame: currentState.currentGame.update({
				gameEnded: true,
				replayXml: event.replayXml,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
