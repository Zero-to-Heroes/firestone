import { DeckFilters } from '../../../../../models/mainwindow/decktracker/deck-filters';
import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ChangeDeckRankFilterEvent } from '../../events/decktracker/change-deck-rank-filter-event';
import { Processor } from '../processor';

export class ChangeDeckRankFilterProcessor implements Processor {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly prefs: PreferencesService,
		private readonly replaysBuilder: ReplaysStateBuilderService,
	) {}

	public async process(
		event: ChangeDeckRankFilterEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
			rank: event.newRank,
		} as DeckFilters);
		const prefs = await this.prefs.setDesktopDeckFilters(filters);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			filters: filters,
			decks: this.decksStateBuilder.buildState(currentState.stats, filters, prefs),
		} as DecktrackerState);
		const replays = this.replaysBuilder.buildState(currentState.replays, currentState.stats, newState.decks);
		return [
			Object.assign(new MainWindowState(), currentState, {
				decktracker: newState,
				replays: replays,
			} as MainWindowState),
			null,
		];
	}
}
