import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class FatiguePlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_FATIGUE_WINDOW,
			(prefs) => prefs.playerFatigueCounter,
			(state) => state?.playerDeck?.fatigue > 0 && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
