import { DeckFilters, MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { ChangeDeckSortEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class ChangeDeckSortProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeDeckSortEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
			sort: event.sort,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		return [null, null];
	}
}
