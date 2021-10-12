import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class AttackPlayerCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_PLAYER_ATTACK_WINDOW,
			(prefs) => prefs.playerAttackCounter,
			(state) => state && !state.isBattlegrounds() && !state.isMercenaries(),
			ow,
			prefs,
			allCards,
		);
	}
}
