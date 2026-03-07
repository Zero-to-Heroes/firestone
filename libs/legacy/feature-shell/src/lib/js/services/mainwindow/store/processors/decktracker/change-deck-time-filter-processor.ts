import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { DeckFilters, PreferencesService } from '@firestone/shared/common/service';
import { ChangeDeckTimeFilterEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class ChangeDeckTimeFilterProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeDeckTimeFilterEvent,
		_currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const currentFilters = prefs?.desktopDeckFilters ?? new DeckFilters();
		const filters = Object.assign(new DeckFilters(), currentFilters, {
			time: event.newFormat,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		return [null, null];
	}
}
