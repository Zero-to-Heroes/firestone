import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesModeFilterSelectedEvent } from '../../events/mercenaries/mercenaries-mode-filter-selected-event';
import { Processor } from '../processor';

export class MercenariesModeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesModeFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesModeFilter(event.mode);
		return [null, null];
	}
}
