import { DeckFilters, PreferencesService } from '@firestone/shared/common/service';
import { Processor } from '../processor';
import {
	ChangeDeckRankCategoryFilterEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';

export class ChangeDeckRankCategoryFilterProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeDeckRankCategoryFilterEvent,
		_currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const prefs = await this.prefs.getPreferences();
		const currentFilters = prefs?.desktopDeckFilters ?? new DeckFilters();
		const filters = Object.assign(new DeckFilters(), currentFilters, {
			rankingCategory: event.newRank,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		return [null, null];
	}
}
