import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

const windowName = OverwolfService.COUNTER_PLAYER_FATIGUE_WINDOW;

export class FatiguePlayerCounterOverlayHandler implements OverlayHandler {
	private showCounter: boolean;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showCounter = preferences.playerFatigueCounter;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets = false,
		forceLogs = false,
	) {
		const inGame = await this.ow.inGame();
		const theWindow = await this.ow.getWindowState(windowName);
		const shouldShowWindow =
			!forceCloseWidgets &&
			state &&
			state?.playerDeck?.fatigue > 0 &&
			state.gameStarted &&
			state.playerDeck &&
			((state.playerDeck.deck && state.playerDeck.deck.length > 0) ||
				(state.playerDeck.hand && state.playerDeck.hand.length > 0) ||
				(state.playerDeck.board && state.playerDeck.board.length > 0) ||
				(state.playerDeck.otherZone && state.playerDeck.otherZone.length > 0));
		// console.log(
		// 	'should show counter?',
		// 	state?.playerDeck?.galakrondInvokesCount,
		// 	state?.playerDeck?.containsGalakrond(this.allCards),
		// );
		if (
			inGame &&
			showDecktrackerFromGameMode &&
			shouldShowWindow &&
			isWindowClosed(theWindow.window_state_ex) &&
			this.showCounter
		) {
			await this.ow.obtainDeclaredWindow(windowName);
			await this.ow.restoreWindow(windowName);
		} else if (!isWindowClosed(theWindow.window_state_ex) && (!shouldShowWindow || !inGame || !this.showCounter)) {
			await this.ow.closeWindow(windowName);
		}
	}
}
