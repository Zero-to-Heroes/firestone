import { LocalizationService } from '@services/localization.service';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../../../models/preferences';
import { Events } from '../../../events.service';
import { PreferencesService } from '../../../preferences.service';
import { ChangeVisibleApplicationEvent } from '../events/change-visible-application-event';
import { StoreInitEvent } from '../events/store-init-event';
import { ChangeVisibleApplicationProcessor } from './change-visible-application-processor';
import { Processor } from './processor';

export class StoreInitProcessor implements Processor {
	constructor(
		private readonly events: Events,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationService,
	) {}

	public async process(
		event: StoreInitEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[store-init] populating store');
		const prefs = await this.prefs.getPreferences();
		// Whenever we move some data init to be async, we need to update this
		// Ultimately we won't need that anymore once all the data is moved to an async init
		const stateToUpdate = event.initialState.update({
			mercenaries: event.initialState.mercenaries.update({
				referenceData: currentState.mercenaries.referenceData,
				globalStats: currentState.mercenaries.globalStats,
			}),
			decktracker: event.initialState.decktracker.update({
				metaDecks: currentState.decktracker.metaDecks,
			}),
		});
		const newState = currentState.update(stateToUpdate);
		if (event.storeReady) {
			console.log('[store-init] emitting STORE_READY event');
			this.events.broadcast(Events.STORE_READY);
		}
		const navState = await this.buildCurrentAppNavState(currentState, navigationState, prefs);
		return [newState, navState];
	}

	private async buildCurrentAppNavState(
		currentState: MainWindowState,
		navigationState: NavigationState,
		prefs: Preferences,
	): Promise<NavigationState> {
		const currentNavApp = navigationState.currentApp;
		// Don't change it if the user has already started to navigate
		if (currentNavApp) {
			return navigationState;
		}

		const currentAppFromPrefs = prefs.currentMainVisibleSection;
		if (currentAppFromPrefs) {
			const [, navState] = await new ChangeVisibleApplicationProcessor(this.prefs, this.i18n).process(
				new ChangeVisibleApplicationEvent(currentAppFromPrefs),
				currentState,
				null,
				navigationState,
			);
			return navState;
		}

		const currentApp = !prefs.ftue.hasSeenGlobalFtue ? undefined : navigationState.currentApp ?? 'decktracker';
		return navigationState.update({
			currentApp: currentApp,
		} as NavigationState);
	}
}
