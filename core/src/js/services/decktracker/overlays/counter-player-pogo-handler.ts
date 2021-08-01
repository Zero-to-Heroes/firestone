import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class PogoPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
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
