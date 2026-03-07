import { ConstructedNavigationService, ConstructedPersonalDecksService } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';

import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { DecktrackerDeleteDeckEvent } from '@firestone/mainwindow/common';
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
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[deck-delete] will delete deck', event.deckstring);
		await this.constructedPersonalDecks.deleteDeck(event.deckstring);
		this.nav.currentView$$.next('decks');
		return [null, null];
	}
}
