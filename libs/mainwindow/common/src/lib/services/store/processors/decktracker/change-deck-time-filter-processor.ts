import { ConstructedNavigationService } from '@firestone/constructed/common';
import { DeckFilters, PreferencesService } from '@firestone/shared/common/service';
import { ChangeDeckTimeFilterEvent, MainWindowState, NavigationState } from '../../store-internal';
import { Processor } from '../processor';

export class ChangeDeckTimeFilterProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly nav: ConstructedNavigationService,
	) {}

	public async process(
		event: ChangeDeckTimeFilterEvent,
		_currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		if (event.newFormat === 'today') {
			this.nav.myDecksTodaySelected$$.next(true);
			return [null, null];
		}

		this.nav.myDecksTodaySelected$$.next(false);
		const prefs = await this.prefs.getPreferences();
		const currentFilters = prefs?.desktopDeckFilters ?? new DeckFilters();
		const filters = Object.assign(new DeckFilters(), currentFilters, {
			time: event.newFormat,
		} as DeckFilters);
		await this.prefs.setDesktopDeckFilters(filters);
		return [null, null];
	}
}
