import { ConstructedNavigationService, ConstructedPersonalDecksService } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { GameStatsLoaderService } from '../../../../stats/game/game-stats-loader.service';
import { DecktrackerDeleteDeckEvent } from '../../events/decktracker/decktracker-delete-deck-event';
import { Processor } from '../processor';

export class DecktrackerDeleteDeckProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly gamesLoader: GameStatsLoaderService,
		private readonly constructedPersonalDecks: ConstructedPersonalDecksService,
		private readonly nav: ConstructedNavigationService,
	) {}

	public async process(
		event: DecktrackerDeleteDeckEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[deck-delete] will delete deck', event.deckstring);
		await this.constructedPersonalDecks.deleteDeck(event.deckstring);

		// If no games were played with the deck, no need to change anything
		const gameStats = await this.gamesLoader.gameStats$$.getValueWithInit();
		const gamesWithDeck = gameStats?.stats?.filter((s) => s.playerDecklist === event.deckstring);
		console.log('[deck-delete] gamesWithDeck', gamesWithDeck?.length);
		if (!gamesWithDeck?.length) {
			this.nav.currentView$$.next('decks');
			return [null, null];
		}

		const currentPrefs = await this.prefs.getPreferences();
		const deletedDeckDates: readonly number[] = currentPrefs.desktopDeckDeletes[event.deckstring] ?? [];
		console.log('[deck-delete] deletedDeckDates', event.deckstring, deletedDeckDates);
		const newDeleteDates: readonly number[] = [Date.now(), ...deletedDeckDates];
		console.log('[deck-delete] newDeleteDates', newDeleteDates);
		await this.prefs.setDeckDeleteDates(event.deckstring, newDeleteDates);
		this.nav.currentView$$.next('decks');
		return [null, null];
	}
}
