import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class LibramPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_LIBRAM_WINDOW,
			(prefs) => prefs.playerLibramCounter,
			(state) => state?.playerDeck?.containsLibram(allCards) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
