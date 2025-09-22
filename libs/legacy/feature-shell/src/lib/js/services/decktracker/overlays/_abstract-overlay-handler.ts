import { GameState } from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';

import { GameStateEvent } from '@firestone/app/common';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

export abstract class AbstractOverlayHandler implements OverlayHandler {
	private showOverlayPref: boolean;

	protected name: string;

	constructor(
		private readonly windowName: string,
		private readonly preferenceExtractor: (prefs: Preferences) => boolean,
		private readonly shouldShowFromState: (
			state: GameState,
			prefs?: Preferences,
			showDecktrackerFromGameMode?: boolean,
		) => boolean,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		private readonly forceLogs = false,
	) {}

	public processEvent(gameEvent: GameEvent | GameStateEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		// Do nothing
		return state;
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showOverlayPref = this.preferenceExtractor(preferences);
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets = false,
		forceLogs = false,
	) {
		const prefs = await this.prefs.getPreferences();
		const theWindow = await this.ow.getWindowState(this.windowName);
		const canShow = await this.canShowOverlay(theWindow, state, forceCloseWidgets);
		const shouldShowFromState = this.shouldShowFromState(state, prefs, showDecktrackerFromGameMode);
		const shouldShow = this.showOverlayPref && this.shouldShow(canShow, shouldShowFromState, prefs, state);
		if (shouldShow && isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.obtainDeclaredWindow(this.windowName);
			await this.ow.restoreWindow(this.windowName);
		} else if (!shouldShow && !isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.closeWindow(this.windowName);
		} else if (this.forceLogs && forceLogs && !shouldShow && isWindowClosed(theWindow.window_state_ex)) {
		}
	}

	protected shouldShow(canShow: boolean, shouldShowFromState: boolean, prefs: Preferences, state: GameState) {
		return canShow && shouldShowFromState;
	}

	private async canShowOverlay(
		window: { window_state_ex: string },
		state: GameState,
		forceCloseWidgets,
	): Promise<boolean> {
		const inGame = await this.ow.inGame();
		if (!inGame) {
			return false;
		}

		if (forceCloseWidgets) {
			return false;
		}

		return (
			state &&
			state.gameStarted &&
			!state.gameEnded &&
			state.playerDeck &&
			((state.playerDeck.deck && state.playerDeck.deck.length > 0) ||
				(state.playerDeck.hand && state.playerDeck.hand.length > 0) ||
				(state.playerDeck.board && state.playerDeck.board.length > 0) ||
				(state.playerDeck.otherZone && state.playerDeck.otherZone.length > 0))
		);
	}
}
