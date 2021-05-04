import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class OpponentHandOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW,
			(prefs) => prefs.dectrackerShowOpponentGuess || prefs.dectrackerShowOpponentTurnDraw,
			(state) => !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
