import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class CthunOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_CTHUN_WINDOW,
			(prefs) => prefs.opponentCthunCounter,
			(state) => state?.opponentDeck?.containsCthun(allCards) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
