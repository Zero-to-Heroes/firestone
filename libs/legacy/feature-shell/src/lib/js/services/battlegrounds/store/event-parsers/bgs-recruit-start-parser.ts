import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { OwUtilsService } from '../../../plugins/ow-utils.service';
import { PreferencesService } from '../../../preferences.service';
import { BgsRecruitStartEvent } from '../events/bgs-recruit-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsRecruitStartParser implements EventParser {
	constructor(private readonly owUtils: OwUtilsService, private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRecruitStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsRecruitStartEvent): Promise<BattlegroundsState> {
		const prefs = await this.prefs.getPreferences();
		if (prefs.flashWindowOnYourTurn) {
			this.owUtils.flashWindow();
		}
		const newGame = currentState.currentGame.update({
			phase: 'recruit',
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
