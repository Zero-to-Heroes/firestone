import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { Events } from '../../../events.service';
import { PreferencesService } from '../../../preferences.service';
import { StoreInitEvent } from '../events/store-init-event';
import { Processor } from './processor';

export class StoreInitProcessor implements Processor {
	constructor(private readonly events: Events, private prefs: PreferencesService) {}

	public async process(
		event: StoreInitEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[store-init] populating store');
		const prefs = await this.prefs.getPreferences();
		const newState = currentState.update(event.initialState);
		console.log('[store-init] emitting STORE_READY event');
		this.events.broadcast(Events.STORE_READY);
		return [
			newState,
			navigationState.update({
				currentApp: !prefs.ftue.hasSeenGlobalFtue ? undefined : navigationState.currentApp,
			} as NavigationState),
		];
	}
}
