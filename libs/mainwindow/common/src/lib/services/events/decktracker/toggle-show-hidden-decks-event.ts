import { MainWindowStoreEvent } from '../main-window-store-event';

export class ToggleShowHiddenDecksEvent implements MainWindowStoreEvent {
	
	readonly eventName = ToggleShowHiddenDecksEvent.eventName

	constructor(public readonly newValue: boolean) {}

	static readonly eventName = 'ToggleShowHiddenDecksEvent'
}
