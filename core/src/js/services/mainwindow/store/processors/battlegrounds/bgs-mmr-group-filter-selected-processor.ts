import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { BgsMmrGroupFilterSelectedEvent } from '../../events/battlegrounds/bgs-mmr-group-filter-selected-event';
import { Processor } from '../processor';

export class BgsMmrGroupFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsMmrGroupFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsMmrGroupFilter(event.mmrGroupFilter);
		return [null, null];
	}
}
