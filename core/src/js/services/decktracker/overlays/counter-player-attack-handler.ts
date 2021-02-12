import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

export class AttackPlayerCounterOverlayHandler implements OverlayHandler {
	private showCounter: boolean;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showCounter = preferences.playerAttackCounter;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets = false,
		forceLogs = false,
	) {
		const inGame = await this.ow.inGame();
		const theWindow = await this.ow.getWindowState(OverwolfService.COUNTER_PLAYER_ATTACK_WINDOW);
		const shouldShowWindow =
			!forceCloseWidgets &&
			state &&
			state.gameStarted &&
			state.playerDeck &&
			((state.playerDeck.deck && state.playerDeck.deck.length > 0) ||
				(state.playerDeck.hand && state.playerDeck.hand.length > 0) ||
				(state.playerDeck.board && state.playerDeck.board.length > 0) ||
				(state.playerDeck.otherZone && state.playerDeck.otherZone.length > 0));
		if (
			inGame &&
			shouldShowWindow &&
			showDecktrackerFromGameMode &&
			!state.isBattlegrounds() &&
			isWindowClosed(theWindow.window_state_ex) &&
			this.showCounter
		) {
			await this.ow.obtainDeclaredWindow(OverwolfService.COUNTER_PLAYER_ATTACK_WINDOW);
			await this.ow.restoreWindow(OverwolfService.COUNTER_PLAYER_ATTACK_WINDOW);
		} else if (
			!isWindowClosed(theWindow.window_state_ex) &&
			(!shouldShowWindow || !inGame || !this.showCounter || state.isBattlegrounds())
		) {
			await this.ow.closeWindow(OverwolfService.COUNTER_PLAYER_ATTACK_WINDOW);
		}
	}
}
