import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class ElwynnBoarPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_ELWYNN_BOAR_WINDOW,
			(prefs) => prefs.playerElwynnBoarCounter,
			(state) => state?.playerDeck?.containsElwynnBoar() && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
