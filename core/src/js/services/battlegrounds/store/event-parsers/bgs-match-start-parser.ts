import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { Preferences } from '../../../../models/preferences';
import { PreferencesService } from '../../../preferences.service';
import { BgsMatchStartEvent } from '../events/bgs-match-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsInitParser } from './bgs-init-parser';
import { EventParser } from './_event-parser';

export class BgsMatchStartParser implements EventParser {
	constructor(private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsMatchStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsMatchStartEvent): Promise<BattlegroundsState> {
		const newGame: BgsGame = BgsGame.create({} as BgsGame);
		const prefs: Preferences = await this.prefs.getPreferences();
		return currentState.update({
			inGame: true,
			// gameEnded: false,
			currentGame: newGame,
			forceOpen: prefs.bgsShowHeroSelectionScreen,
			stages: BgsInitParser.buildEmptyStages(currentState),
		} as BattlegroundsState);
	}
}
