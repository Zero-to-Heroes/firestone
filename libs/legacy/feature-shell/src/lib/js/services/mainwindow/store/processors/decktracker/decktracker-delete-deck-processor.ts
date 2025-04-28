import { ConstructedNavigationService, ConstructedPersonalDecksService } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';

import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
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
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[deck-delete] will delete deck', event.deckstring);
		await this.constructedPersonalDecks.deleteDeck(event.deckstring);
		this.nav.currentView$$.next('decks');
		return [null, null];
	}
}
