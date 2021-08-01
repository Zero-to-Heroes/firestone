import { CardsFacadeService } from '@services/cards-facade.service';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class SecretsHelperOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.SECRETS_HELPER_WINDOW,
			(prefs) => prefs.secretsHelper,
			(state) => state.opponentDeck?.secrets?.length && !state.isBattlegrounds(),
			ow,
			prefs,
			allCards,
		);
	}
}
