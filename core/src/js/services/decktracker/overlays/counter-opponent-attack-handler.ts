import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class AttackOpponentCounterOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.COUNTER_OPPONENT_ATTACK_WINDOW,
			(prefs) => prefs.opponentAttackCounter,
			(state) => !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
