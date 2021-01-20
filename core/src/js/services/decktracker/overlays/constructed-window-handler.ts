import { GameState } from '../../../models/decktracker/game-state';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { ConstructedCloseWindowEvent } from '../event/constructed-close-window-event';
import { OverlayHandler } from './overlay-handler';

export class ConstructedWindowHandler implements OverlayHandler {
	private closedByUser: boolean;
	private enabled: boolean;

	constructor(private readonly ow: OverwolfService) {}

	public processEvent(gameEvent: GameEvent | GameStateEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		if (gameEvent.type === ConstructedCloseWindowEvent.TYPE) {
			console.log('[constructed-window] handling overlay for event', gameEvent.type);
			this.closedByUser = true;
			this.updateOverlay(state, showDecktrackerFromGameMode);
		} else if (gameEvent.type === GameEvent.GAME_START) {
			console.log('[constructed-window] handling overlay for event', gameEvent.type);
			this.closedByUser = false;
			this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		}
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.enabled = preferences.achievementsLiveTracking;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets = false,
		forceLogs = false,
	) {
		const inGame = await this.ow.inGame();
		const windowName = OverwolfService.CONSTRUCTED_WINDOW;
		// if (forceLogs) {
		// 	console.log('[constructed-window] inGame?', inGame);
		// }
		const theWindow = await this.ow.getWindowState(windowName);
		// if (forceLogs) {
		// 	console.log('[constructed-window] retrieved window', decktrackerWindow);
		// }

		const shouldShowTracker =
			state &&
			state.metadata.gameType > 0 &&
			// (state.metadata.gameType === GameType.GT_ARENA ||
			// 	state.metadata.gameType === GameType.GT_PVPDR ||
			// 	state.metadata.gameType === GameType.GT_PVPDR_PAID ||
			// 	state.metadata.gameType === GameType.GT_RANKED) &&
			state.playerDeck &&
			((state.playerDeck.deck && state.playerDeck.deck.length > 0) ||
				(state.playerDeck.hand && state.playerDeck.hand.length > 0) ||
				(state.playerDeck.board && state.playerDeck.board.length > 0) ||
				(state.playerDeck.otherZone && state.playerDeck.otherZone.length > 0));
		if (forceLogs) {
			console.log(
				'[constructed-window] should show?',
				inGame,
				shouldShowTracker,
				showDecktrackerFromGameMode,
				theWindow.window_state_ex,
				this.closedByUser,
				state?.playerDeck,
				state?.metadata,
			);
		}
		if (
			this.enabled &&
			inGame &&
			shouldShowTracker &&
			isWindowClosed(theWindow.window_state_ex) &&
			showDecktrackerFromGameMode &&
			!this.closedByUser
		) {
			// console.log('[constructed-window] showing tracker');
			await this.ow.obtainDeclaredWindow(windowName);
			await this.ow.restoreWindow(windowName);
		} else if (
			!isWindowClosed(theWindow.window_state_ex) &&
			(!shouldShowTracker || !showDecktrackerFromGameMode || this.closedByUser || !inGame)
		) {
			console.log(
				'[constructed-window] closing tracker',
				theWindow,
				shouldShowTracker,
				showDecktrackerFromGameMode,
				this.closedByUser,
				inGame,
				state.metadata.gameType,
			);
			await this.ow.closeWindow(windowName);
		}
		// if (forceLogs) {
		// 	console.log(
		// 		'[constructed-window] tracker window handled',
		// 		await this.ow.obtainDeclaredWindow(windowName),
		// 	);
		// }
	}
}
