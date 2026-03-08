import { DeckFilters, PreferencesService } from '@firestone/shared/common/service';
import {
	ChangeDeckSortEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class ChangeDeckSortProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeDeckSortEvent,
		_currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const prefs = await this.prefs.getPreferences();
		const currentFilters = prefs?.desktopDeckFilters ?? new DeckFilters();
		const filters = Object.assign(new DeckFilters(), currentFilters, {
			sort: event.sort,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		return [null, null];
	}
}
