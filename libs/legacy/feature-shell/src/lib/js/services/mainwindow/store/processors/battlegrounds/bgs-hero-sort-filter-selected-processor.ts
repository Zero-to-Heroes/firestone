import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsHeroSortFilterSelectedEvent } from '../../events/battlegrounds/bgs-hero-sort-filter-selected-event';
import { Processor } from '../processor';

export class BgsHeroSortFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsHeroSortFilterSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsHeroSortFilter(event.heroSortFilter);
		return [null, null];
	}
}
