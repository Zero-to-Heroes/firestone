import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class OpponentHandOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW,
			(prefs) => prefs.dectrackerShowOpponentGuess || prefs.dectrackerShowOpponentTurnDraw,
			(state) => state && !state.isBattlegrounds() && !state.isMercenaries(),
			ow,
			prefs,
			allCards,
		);
	}
}
