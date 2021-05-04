import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class LibramOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_LIBRAM_WINDOW,
			(prefs) => prefs.opponentLibramCounter,
			(state) => state?.opponentDeck?.containsLibram(allCards, true) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
