import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class BolnerPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_BOLNER_WINDOW,
			(prefs) => prefs.playerBolnerCounter,
			(state) =>
				!!state?.playerDeck?.firstBattlecryPlayedThisTurn(allCards) &&
				state.playerDeck.hasBolner() &&
				state &&
				!state.isBattlegrounds() &&
				!state.isMercenaries(),
			ow,
			prefs,
			allCards,
		);
	}
}
