import { GameType } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

export class PlayerDeckOverlayHandler implements OverlayHandler {
	private closedByUser: boolean;

	constructor(private readonly ow: OverwolfService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		if (gameEvent.type === 'CLOSE_TRACKER') {
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
		// Nothing to do
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets = false,
		forceLogs = false,
	) {
		if (forceLogs) {
			console.log(
				'[player-overlay] will consider overlay for player deck',
				state,
				showDecktrackerFromGameMode,
				forceCloseWidgets,
			);
		}
		// TODO: don't forget to change this
		// For now, it looks like the scene_state event from the GEP isn't fired anymore?
		const inGame = await this.ow.inGame(); //(this.onGameScreen || !prefs.decktrackerCloseOnGameEnd);
		if (forceLogs) {
			console.log('[game-state] inGame?', inGame);
		}
		const decktrackerWindow = await this.ow.getWindowState(OverwolfService.DECKTRACKER_WINDOW);
		if (forceLogs) {
			console.log('[game-state] retrieved window', decktrackerWindow);
		}

		const shouldShowTracker =
			state &&
			state.metadata.gameType > 0 &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS_FRIENDLY &&
			state.playerDeck &&
			((state.playerDeck.deck && state.playerDeck.deck.length > 0) ||
				(state.playerDeck.hand && state.playerDeck.hand.length > 0) ||
				(state.playerDeck.board && state.playerDeck.board.length > 0) ||
				(state.playerDeck.otherZone && state.playerDeck.otherZone.length > 0));
		if (forceLogs) {
			console.log(
				'[game-state] should show tracker?',
				inGame,
				shouldShowTracker,
				showDecktrackerFromGameMode,
				decktrackerWindow.window_state_ex,
				this.closedByUser,
				state?.playerDeck,
				state?.metadata,
			);
		}
		if (
			inGame &&
			shouldShowTracker &&
			isWindowClosed(decktrackerWindow.window_state_ex) &&
			showDecktrackerFromGameMode &&
			!this.closedByUser
		) {
			console.log('[game-state] showing tracker');
			await this.ow.obtainDeclaredWindow(OverwolfService.DECKTRACKER_WINDOW);
			await this.ow.restoreWindow(OverwolfService.DECKTRACKER_WINDOW);
		} else if (
			!isWindowClosed(decktrackerWindow.window_state_ex) &&
			(!shouldShowTracker || !showDecktrackerFromGameMode || this.closedByUser || !inGame)
		) {
			console.log('[game-state] closing tracker');
			await this.ow.closeWindow(OverwolfService.DECKTRACKER_WINDOW);
		}
		if (forceLogs) {
			console.log(
				'[game-state] tracker window handled',
				await this.ow.obtainDeclaredWindow(OverwolfService.DECKTRACKER_WINDOW),
			);
		}
	}
}
