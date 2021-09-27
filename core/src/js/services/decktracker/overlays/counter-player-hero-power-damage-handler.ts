import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class HeroPowerDamagePlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_HERO_POWER_DAMAGE,
			(prefs) => prefs.playerHeroPowerDamageCounter,
			(state) => state?.playerDeck?.containsHeroPowerDamageCard() && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
