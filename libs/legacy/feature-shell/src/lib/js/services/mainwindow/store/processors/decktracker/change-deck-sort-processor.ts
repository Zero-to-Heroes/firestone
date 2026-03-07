import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { DeckFilters, PreferencesService } from '@firestone/shared/common/service';
import { ChangeDeckSortEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class ChangeDeckSortProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeDeckSortEvent,
		_currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const currentFilters = prefs?.desktopDeckFilters ?? new DeckFilters();
		const filters = Object.assign(new DeckFilters(), currentFilters, {
			sort: event.sort,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		return [null, null];
	}
}
