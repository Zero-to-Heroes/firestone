import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class JadeGolemPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_JADE_WINDOW,
			(prefs) => prefs.playerJadeGolemCounter,
			(state) =>
				state?.playerDeck?.containsJade(allCards) &&
				state &&
				!state.isBattlegrounds() &&
				!state.isMercenaries(),
			ow,
			prefs,
			allCards,
		);
	}
}
