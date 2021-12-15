import { Preferences } from '../../../../models/preferences';
import { MainWindowStoreEvent } from './main-window-store-event';

export class GenericPreferencesUpdateEvent implements MainWindowStoreEvent {
	constructor(public readonly patcher: (prefs: Preferences) => Preferences) {}

	public static eventName(): string {
		return 'GenericPreferencesUpdateEvent';
	}

	public eventName(): string {
		return 'GenericPreferencesUpdateEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
