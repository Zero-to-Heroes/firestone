import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesHeroLevelFilterSelectedEvent } from '../../events/mercenaries/mercenaries-hero-level-filter-selected-event';
import { Processor } from '../processor';

export class MercenariesHeroLevelFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesHeroLevelFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesHeroLevelFilter(event.level);
		return [null, null];
	}
}
