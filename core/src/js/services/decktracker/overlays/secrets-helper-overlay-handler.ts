import { AllCardsService } from '@firestone-hs/replay-parser';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class SecretsHelperOverlayHandler extends AbstractOverlayHandler {
	constructor(ow: OverwolfService, allCards: AllCardsService, prefs: PreferencesService) {
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
