import { MainWindowStoreEvent } from './main-window-store-event';
import { Preferences } from '@firestone/shared/common/service';

export class GenericPreferencesUpdateEvent implements MainWindowStoreEvent {
	readonly eventName = GenericPreferencesUpdateEvent.eventName

	constructor(public readonly patcher: (prefs: Preferences) => Preferences) {}

	static readonly eventName = 'GenericPreferencesUpdateEvent'
}
