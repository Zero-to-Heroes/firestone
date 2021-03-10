import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { Events } from '../../../events.service';
import { PreferencesService } from '../../../preferences.service';
import { ChangeVisibleApplicationEvent } from '../events/change-visible-application-event';
import { StoreInitEvent } from '../events/store-init-event';
import { ChangeVisibleApplicationProcessor } from './change-visible-application-processor';
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
		const newState = currentState.update(event.initialState);
		console.log('[store-init] emitting STORE_READY event');
		this.events.broadcast(Events.STORE_READY);
		const navState = await this.buildNavState(currentState, navigationState);
		return [newState, navState];
	}

	private async buildNavState(
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<NavigationState> {
		const currentAppFromPrefs = (await this.prefs.getPreferences()).currentMainVisibleSection;
		if (currentAppFromPrefs) {
			console.debug('setting current app from prefs', currentAppFromPrefs);
			const [, navState] = await new ChangeVisibleApplicationProcessor(this.prefs).process(
				new ChangeVisibleApplicationEvent(currentAppFromPrefs),
				currentState,
				null,
				navigationState,
			);
			return navState;
		}

		const prefs = await this.prefs.getPreferences();
		const currentApp = !prefs.ftue.hasSeenGlobalFtue ? undefined : navigationState.currentApp ?? 'decktracker';
		return navigationState.update({
			currentApp: currentApp,
		} as NavigationState);
	}
}
