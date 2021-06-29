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
		console.debug(
			'changing phase to recruit',
			shouldHideResultsOnRecruit,
			currentState.currentGame.lastNonEmptyBattleResult(),
		);
		const newGame = currentState.currentGame.update({
			phase: 'recruit',
			// Because we want to be able to show the battle status on the tavern, even if a new face off has been
			// initialised
			battleInfoStatus:
				shouldHideResultsOnRecruit || !currentState.currentGame.lastNonEmptyBattleResult() ? 'empty' : 'done',
			battleInfoMesage:
				shouldHideResultsOnRecruit || !currentState.currentGame.lastNonEmptyBattleResult()
					? undefined
					: currentState.currentGame.battleInfoMesage,
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
