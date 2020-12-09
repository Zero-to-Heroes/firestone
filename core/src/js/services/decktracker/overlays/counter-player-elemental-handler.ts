import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { isWindowClosed } from '../../utils';
import { OverlayHandler } from './overlay-handler';

const windowName = OverwolfService.COUNTER_PLAYER_ELEMENTAL_WINDOW;

export class ElementalPlayerCounterOverlayHandler implements OverlayHandler {
	private showCounter: boolean;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	public processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showCounter = preferences.playerElementalCounter;
	}

	public async updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets = false,
		forceLogs = false,
	) {
		const inGame = await this.ow.inGame();
		const theWindow = await this.ow.getWindowState(windowName);
		const hasRelevantInfo =
			this.containsCards(state?.playerDeck?.hand, [CardIds.Collectible.Mage.ManaCyclone]) ||
			this.containsCards(state?.playerDeck?.hand, [
				CardIds.Collectible.Mage.GrandFinale,
				CardIds.Collectible.Neutral.Ozruk,
			]);
		const shouldShowWindow = !forceCloseWidgets && state && hasRelevantInfo && state.gameStarted;
		// console.log(
		// 	'spell counter',
		// 	'should show?',
		// 	inGame,
		// 	showDecktrackerFromGameMode,
		// 	shouldShowWindow,
		// 	isWindowClosed(theWindow.window_state_ex),
		// 	this.showCounter,
		// 	theWindow,
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

	private containsCards(zone: readonly DeckCard[], cardIds: string[]): boolean {
		return (zone || []).some(card => cardIds.includes(card.cardId));
	}
}
