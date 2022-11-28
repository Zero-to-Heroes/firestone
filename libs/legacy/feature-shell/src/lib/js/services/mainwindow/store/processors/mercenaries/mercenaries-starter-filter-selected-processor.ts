import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesStarterFilterSelectedEvent } from '../../events/mercenaries/mercenaries-starter-filter-selected-event';
import { Processor } from '../processor';

export class MercenariesStarterFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesStarterFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesStarterFilter(event.starter);
		return [null, null];
	}
}
