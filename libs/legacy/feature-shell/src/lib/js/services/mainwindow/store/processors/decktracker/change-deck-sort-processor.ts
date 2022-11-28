import { DeckFilters } from '../../../../../models/mainwindow/decktracker/deck-filters';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { ChangeDeckSortEvent } from '../../events/decktracker/change-deck-sort-event';
import { Processor } from '../processor';

export class ChangeDeckSortProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeDeckSortEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
			sort: event.sort,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		return [null, null];
	}
}
