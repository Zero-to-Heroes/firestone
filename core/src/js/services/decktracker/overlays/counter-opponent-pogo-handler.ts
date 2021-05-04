import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class PogoOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_POGO_WINDOW,
			(prefs) => prefs.opponentPogoCounter,
			(state) => state?.opponentDeck?.containsPogoHopper() && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
