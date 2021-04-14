import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { PreferencesService } from '../../../preferences.service';
import { BgsRecruitStartEvent } from '../events/bgs-recruit-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsRecruitStartParser implements EventParser {
	constructor(private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRecruitStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsRecruitStartEvent): Promise<BattlegroundsState> {
		const prefs = await this.prefs.getPreferences();
		const shouldHideResultsOnRecruit = prefs.bgsHideSimResultsOnRecruit && !prefs.bgsShowSimResultsOnlyOnRecruit;
		const newGame = currentState.currentGame.update({
			phase: 'recruit',
			battleInfo: shouldHideResultsOnRecruit ? undefined : currentState.currentGame.battleInfo,
			battleResult: shouldHideResultsOnRecruit ? undefined : currentState.currentGame.battleResult,
			battleInfoStatus: shouldHideResultsOnRecruit || !currentState.currentGame.battleResult ? 'empty' : 'done',
			battleInfoMesage:
				shouldHideResultsOnRecruit || !currentState.currentGame.battleResult
					? undefined
					: currentState.currentGame.battleInfoMesage,
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
