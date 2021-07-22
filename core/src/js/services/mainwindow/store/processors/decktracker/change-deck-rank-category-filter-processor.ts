import { DeckFilters } from '../../../../../models/mainwindow/decktracker/deck-filters';
import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ChangeDeckRankCategoryFilterEvent } from '../../events/decktracker/change-deck-rank-category-filter-event';
import { Processor } from '../processor';

export class ChangeDeckRankCategoryFilterProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly replaysBuilder: ReplaysStateBuilderService,
	) {}

	public async process(
		event: ChangeDeckRankCategoryFilterEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
			rankingCategory: event.newRank,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			filters: filters,
		} as DecktrackerState);
		const replays = await this.replaysBuilder.buildState(currentState.replays, currentState.stats, newState.decks);
		return [
			Object.assign(new MainWindowState(), currentState, {
				decktracker: newState,
				replays: replays,
			} as MainWindowState),
			null,
		];
	}
}
