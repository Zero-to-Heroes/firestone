import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

export class GalakroundOpponentCounterOverlayHandler implements OverlayHandler {
	private showCounter: boolean;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showCounter = preferences.opponentGalakrondCounter;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets = false,
		forceLogs = false,
	) {
		const inGame = await this.ow.inGame();
		const theWindow = await this.ow.getWindowState(OverwolfService.COUNTER_OPPONENT_GALAKROND_WINDOW);
		const shouldShowWindow =
			!forceCloseWidgets &&
			(state?.opponentDeck?.galakrondInvokesCount > 0 || state?.opponentDeck?.containsGalakrond(this.allCards));
		// console.log(
		// 	'[opponent-galakrond] should show counter?',
		// 	state?.opponentDeck?.galakrondInvokesCount,
		// 	state?.opponentDeck?.containsGalakrond(this.allCards),
		// );
		if (
			inGame &&
			showDecktrackerFromGameMode &&
			shouldShowWindow &&
			isWindowClosed(theWindow.window_state_ex) &&
			this.showCounter
		) {
			await this.ow.obtainDeclaredWindow(OverwolfService.COUNTER_OPPONENT_GALAKROND_WINDOW);
			await this.ow.restoreWindow(OverwolfService.COUNTER_OPPONENT_GALAKROND_WINDOW);
		} else if (!isWindowClosed(theWindow.window_state_ex) && (!shouldShowWindow || !inGame || !this.showCounter)) {
			await this.ow.closeWindow(OverwolfService.COUNTER_OPPONENT_GALAKROND_WINDOW);
		}
	}
}
