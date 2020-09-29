import { DeckFilters } from '../../../../../models/mainwindow/decktracker/deck-filters';
import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ChangeDeckSortEvent } from '../../events/decktracker/change-deck-sort-event';
import { Processor } from '../processor';

export class ChangeDeckSortProcessor implements Processor {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly prefs: PreferencesService,
	) {}

	public async process(
		event: ChangeDeckSortEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
			sort: event.sort,
		} as DeckFilters);
		this.prefs.setDesktopDeckFilters(filters);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			filters: filters,
			decks: this.decksStateBuilder.buildState(currentState.stats, filters),
		} as DecktrackerState);
		// TODO: this probably isn't split properly, but since we don't have any kind of navigation
		// in the tracker part, I won't bother too much with it for now
		return [
			Object.assign(new MainWindowState(), currentState, {
				decktracker: newState,
			} as MainWindowState),
			null,
		];
	}
}
