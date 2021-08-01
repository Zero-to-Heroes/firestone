import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class GalakroundPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_GALAKROND_WINDOW,
			(prefs) => prefs.playerGalakrondCounter,
			(state) => state?.playerDeck?.containsGalakrond(allCards) && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
