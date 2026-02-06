import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { BgsHeroFilterSelectedEvent } from '../../events/battlegrounds/bgs-hero-filter-selected-event';
import { Processor } from '../processor';

export class BgsHeroFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsHeroFilterSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsHeroFilter(event.heroFilter);
		return [null, null];
	}
}
