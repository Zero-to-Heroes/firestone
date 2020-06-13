import { GameType } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

export class OpponentHandOverlayHandler implements OverlayHandler {
	private gameEnded: boolean;
	private showOpponentHand: boolean;

	constructor(private readonly ow: OverwolfService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		if (gameEvent.type === GameEvent.GAME_START) {
			this.gameEnded = false;
		} else if (gameEvent.type === GameEvent.GAME_END) {
			this.gameEnded = true;
		}
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showOpponentHand = preferences.dectrackerShowOpponentGuess || preferences.dectrackerShowOpponentTurnDraw;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		shouldForceCloseSecretsHelper = false,
		forceLogs = false,
	) {
		if (forceLogs) {
			console.log(
				'[opponent-hand-overlay] will consider overlay for player deck',
				state,
				showDecktrackerFromGameMode,
				shouldForceCloseSecretsHelper,
			);
		}
		const inGame = await this.ow.inGame();
		const opponentHandWindow = await this.ow.getWindowState(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
		if (
			inGame &&
			state &&
			state.gameStarted &&
			state.metadata &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS_FRIENDLY &&
			!this.gameEnded &&
			isWindowClosed(opponentHandWindow.window_state_ex) &&
			this.showOpponentHand
		) {
			await this.ow.obtainDeclaredWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
			await this.ow.restoreWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
		} else if (
			!isWindowClosed(opponentHandWindow.window_state_ex) &&
			(this.gameEnded ||
				!state ||
				!state.gameStarted ||
				!this.showOpponentHand ||
				!inGame ||
				(state.metadata &&
					(state.metadata.gameType === GameType.GT_BATTLEGROUNDS ||
						state.metadata.gameType === GameType.GT_BATTLEGROUNDS_FRIENDLY)))
		) {
			await this.ow.closeWindow(OverwolfService.MATCH_OVERLAY_OPPONENT_HAND_WINDOW);
		}
	}
}
