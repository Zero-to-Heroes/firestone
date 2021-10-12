import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class HeroPowerDamageOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_HERO_POWER_DAMAGE,
			(prefs) => prefs.opponentHeroPowerDamageCounter,
			(state) =>
				state &&
				!state.isBattlegrounds() &&
				!state.isMercenaries() &&
				state?.opponentDeck?.heroPowerDamageThisMatch > 0 &&
				state.opponentDeck.hero?.playerClass === 'mage',
			ow,
			prefs,
			allCards,
		);
	}
}
