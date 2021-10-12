import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class FatiguePlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_FATIGUE_WINDOW,
			(prefs) => prefs.playerFatigueCounter,
			(state) => state?.playerDeck?.fatigue > 0 && state && !state.isBattlegrounds() && !state.isMercenaries(),
			ow,
			prefs,
			allCards,
		);
	}
}
