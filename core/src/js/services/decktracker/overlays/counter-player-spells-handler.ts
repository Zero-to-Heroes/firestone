import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class SpellsPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_SPELL_WINDOW,
			(prefs) => prefs.playerSpellCounter,
			(state) => state?.playerDeck?.containsSpellCounterMinion() && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
