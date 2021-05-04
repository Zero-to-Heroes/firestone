import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class PogoPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_POGO_WINDOW,
			(prefs) => prefs.playerPogoCounter,
			(state) => state?.playerDeck?.containsPogoHopper(),
			ow,
			prefs,
			allCards,
		);
	}
}
