import { GameType } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

export class OpponentDeckOverlayHandler implements OverlayHandler {
	private closedByUser: boolean;
	private showOpponentTracker: boolean;

	constructor(private readonly ow: OverwolfService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		if (gameEvent.type === 'CLOSE_OPPONENT_TRACKER') {
			// console.log('[game-state] handling overlay for event', gameEvent.type);
			this.closedByUser = true;
			this.updateOverlay(state, showDecktrackerFromGameMode);
		} else if (gameEvent.type === GameEvent.GAME_START) {
			// console.log('[game-state] handling overlay for event', gameEvent.type);
			this.closedByUser = false;
			// this.gameEnded = false;
			this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		}
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showOpponentTracker = preferences.opponentTracker;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		shouldForceCloseSecretsHelper = false,
		forceLogs = false,
	) {
		const inGame = await this.ow.inGame();
		const decktrackerWindow = await this.ow.getWindowState(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
		const shouldShowTracker =
			state &&
			state.opponentDeck &&
			state.metadata.gameType > 0 &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS_FRIENDLY &&
			((state.opponentDeck.deck && state.opponentDeck.deck.length > 0) ||
				(state.opponentDeck.hand && state.opponentDeck.hand.length > 0) ||
				(state.opponentDeck.board && state.opponentDeck.board.length > 0) ||
				(state.opponentDeck.otherZone && state.opponentDeck.otherZone.length > 0));
		// console.log('showing opponent deck?', inGame, decktrackerWindow, shouldShowTracker, state);
		if (
			inGame &&
			shouldShowTracker &&
			isWindowClosed(decktrackerWindow.window_state_ex) &&
			showDecktrackerFromGameMode &&
			this.showOpponentTracker &&
			!this.closedByUser
		) {
			await this.ow.obtainDeclaredWindow(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
			await this.ow.restoreWindow(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
		} else if (
			!isWindowClosed(decktrackerWindow.window_state_ex) &&
			(!shouldShowTracker ||
				!showDecktrackerFromGameMode ||
				!this.showOpponentTracker ||
				this.closedByUser ||
				!inGame)
		) {
			console.log(
				'[opponent-overlay] closing window',
				decktrackerWindow.window_state_ex,
				shouldShowTracker,
				this.showOpponentTracker,
				this.closedByUser,
				inGame,
			);
			await this.ow.closeWindow(OverwolfService.DECKTRACKER_OPPONENT_WINDOW);
		}
	}
}
