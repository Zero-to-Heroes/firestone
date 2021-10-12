import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class PogoOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_POGO_WINDOW,
			(prefs) => prefs.opponentPogoCounter,
			(state) =>
				state?.opponentDeck?.containsPogoHopper() &&
				state &&
				!state.isBattlegrounds() &&
				!state.isMercenaries(),
			ow,
			prefs,
			allCards,
		);
	}
}
