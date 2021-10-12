import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class GalakroundOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_GALAKROND_WINDOW,
			(prefs) => prefs.opponentGalakrondCounter,
			(state) =>
				state?.opponentDeck?.containsGalakrond(allCards) &&
				state &&
				!state.isBattlegrounds() &&
				!state.isMercenaries(),
			ow,
			prefs,
			allCards,
		);
	}
}
