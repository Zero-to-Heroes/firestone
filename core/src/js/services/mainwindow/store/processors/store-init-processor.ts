import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { OverwolfService } from '../../../overwolf.service';
import { PreferencesService } from '../../../preferences.service';
import { UserService } from '../../../user.service';
import { StoreInitEvent } from '../events/store-init-event';
import { Processor } from './processor';

// TOREMOVE
export class StoreInitProcessor implements Processor {
	constructor(private ow: OverwolfService, private userService: UserService, private prefs: PreferencesService) {}

	public async process(
		event: StoreInitEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[store-init] populating store', event, currentState);
		const prefs = await this.prefs.getPreferences();
		return [
			currentState.update(event.initialState),
			navigationState.update({
				currentApp: !prefs.ftue.hasSeenGlobalFtue ? undefined : navigationState.currentApp,
				text: 'Categories',
			} as NavigationState),
		];
	}
}
