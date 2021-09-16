import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { BgsTribesFilterSelectedEvent } from '../../events/battlegrounds/bgs-tribes-filter-selected-event';
import { Processor } from '../processor';

export class BgsTribesFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: BgsTribesFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsTribesFilter(event.tribes);
		// console.log('updated time filter', bgsState);
		return [null, null];
	}
}
