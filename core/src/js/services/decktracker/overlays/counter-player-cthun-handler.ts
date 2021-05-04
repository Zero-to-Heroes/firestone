import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class CthunPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_CTHUN_WINDOW,
			(prefs) => prefs.playerCthunCounter,
			(state) => state?.playerDeck?.containsCthun(allCards) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
