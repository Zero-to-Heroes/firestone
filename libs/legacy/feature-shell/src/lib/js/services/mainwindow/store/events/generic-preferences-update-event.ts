import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { Preferences } from '@firestone/shared/common/service';

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
