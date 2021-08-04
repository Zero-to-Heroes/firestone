import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class ElwynnBoarOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_ELWYNN_BOAR_WINDOW,
			(prefs) => prefs.opponentElwynnBoarCounter,
			(state) => state?.opponentDeck?.containsElwynnBoar() && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
