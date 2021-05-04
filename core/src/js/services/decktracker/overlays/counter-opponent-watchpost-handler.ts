import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class WatchpostOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_WATCHPOST_WINDOW,
			(prefs) => prefs.opponentWatchpostCounter,
			(state) => state?.opponentDeck?.containsWatchpost(allCards, true) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
