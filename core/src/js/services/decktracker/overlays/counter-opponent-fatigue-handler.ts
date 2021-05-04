import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

const windowName = OverwolfService.COUNTER_OPPONENT_FATIGUE_WINDOW;

export class FatigueOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_FATIGUE_WINDOW,
			(prefs) => prefs.opponentFatigueCounter,
			(state) => state.opponentDeck?.fatigue > 0 && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
