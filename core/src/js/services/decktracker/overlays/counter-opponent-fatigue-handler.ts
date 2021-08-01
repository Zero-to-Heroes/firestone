import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class FatigueOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
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
