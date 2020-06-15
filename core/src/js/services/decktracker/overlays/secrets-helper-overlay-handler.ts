import { GameType } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

export class SecretsHelperOverlayHandler implements OverlayHandler {
	private closedByUser: boolean;
	private showSecretsHelper: boolean;

	constructor(private readonly ow: OverwolfService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showSecretsHelper = preferences.secretsHelper;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		shouldForceCloseSecretsHelper = false,
		forceLogs = false,
	) {
		const inGame = await this.ow.inGame();
		const secretsHelperWindow = await this.ow.getWindowState(OverwolfService.SECRETS_HELPER_WINDOW);
		const shouldShowSecretsHelper =
			!shouldForceCloseSecretsHelper &&
			state &&
			state.opponentDeck &&
			state.opponentDeck.secrets &&
			state.opponentDeck.secrets.length > 0 &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS_FRIENDLY;
		if (
			inGame &&
			shouldShowSecretsHelper &&
			isWindowClosed(secretsHelperWindow.window_state_ex) &&
			this.showSecretsHelper
		) {
			await this.ow.obtainDeclaredWindow(OverwolfService.SECRETS_HELPER_WINDOW);
			await this.ow.restoreWindow(OverwolfService.SECRETS_HELPER_WINDOW);
		} else if (
			!isWindowClosed(secretsHelperWindow.window_state_ex) &&
			(!shouldShowSecretsHelper || !inGame || !this.showSecretsHelper)
		) {
			await this.ow.closeWindow(OverwolfService.SECRETS_HELPER_WINDOW);
		}
	}
}
