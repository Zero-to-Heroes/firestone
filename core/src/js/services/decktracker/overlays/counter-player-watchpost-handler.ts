import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class WatchpostPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_WATCHPOST_WINDOW,
			(prefs) => prefs.playerWatchpostCounter,
			(state) => state?.playerDeck?.containsWatchpost(allCards, true) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
