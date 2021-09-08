import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { BgsTimeFilterSelectedEvent } from '../../events/battlegrounds/bgs-time-filter-selected-event';
import { Processor } from '../processor';

export class BgsTimeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsTimeFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsTimeFilter(event.timeFilter);
		return [null, null];
	}
}
