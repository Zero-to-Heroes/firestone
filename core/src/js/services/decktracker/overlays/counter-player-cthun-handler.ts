import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class CthunPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_CTHUN_WINDOW,
			(prefs) => prefs.playerCthunCounter,
			(state) =>
				state?.playerDeck?.containsCthun(allCards) &&
				state &&
				!state.isBattlegrounds() &&
				!state.isMercenaries(),
			ow,
			prefs,
			allCards,
		);
	}
}
