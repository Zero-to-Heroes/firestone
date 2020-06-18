import { GameType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

export class AttackOpponentCounterOverlayHandler implements OverlayHandler {
	private showCounter: boolean;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showCounter = preferences.opponentAttackCounter;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets = false,
		forceLogs = false,
	) {
		const inGame = await this.ow.inGame();
		const theWindow = await this.ow.getWindowState(OverwolfService.COUNTER_OPPONENT_ATTACK_WINDOW);
		const shouldShowWindow = !forceCloseWidgets && state && state.gameStarted;
		if (
			inGame &&
			showDecktrackerFromGameMode &&
			shouldShowWindow &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS &&
			state.metadata.gameType !== GameType.GT_BATTLEGROUNDS_FRIENDLY &&
			isWindowClosed(theWindow.window_state_ex) &&
			this.showCounter
		) {
			await this.ow.obtainDeclaredWindow(OverwolfService.COUNTER_OPPONENT_ATTACK_WINDOW);
			await this.ow.restoreWindow(OverwolfService.COUNTER_OPPONENT_ATTACK_WINDOW);
		} else if (!isWindowClosed(theWindow.window_state_ex) && (!shouldShowWindow || !inGame || !this.showCounter)) {
			await this.ow.closeWindow(OverwolfService.COUNTER_OPPONENT_ATTACK_WINDOW);
		}
	}
}
