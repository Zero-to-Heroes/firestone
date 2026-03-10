import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesToggleShowHiddenTeamsEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesToggleShowHiddenTeamsEvent.eventName

	constructor(public readonly newValue: boolean) {}

	static readonly eventName = 'MercenariesToggleShowHiddenTeamsEvent'
}
