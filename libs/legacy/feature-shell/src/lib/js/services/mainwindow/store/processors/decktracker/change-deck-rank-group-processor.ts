import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { DeckFilters, PreferencesService } from '@firestone/shared/common/service';
import { ChangeDeckRankGroupEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class ChangeDeckRankGroupProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ChangeDeckRankGroupEvent,
		_currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const currentFilters = prefs?.desktopDeckFilters ?? new DeckFilters();
		const filters = Object.assign(new DeckFilters(), currentFilters, {
			rankingGroup: event.newRank,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		return [null, null];
	}
}
