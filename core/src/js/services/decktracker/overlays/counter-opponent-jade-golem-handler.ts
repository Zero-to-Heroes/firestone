import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class JadeGolemOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_JADE_WINDOW,
			(prefs) => prefs.opponentJadeGolemCounterCounter,
			(state) => state?.opponentDeck?.containsJade(allCards) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
