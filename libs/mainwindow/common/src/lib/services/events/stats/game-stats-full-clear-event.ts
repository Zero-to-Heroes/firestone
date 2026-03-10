import { MainWindowStoreEvent } from '../main-window-store-event';

export class GamesFullClearEvent implements MainWindowStoreEvent {
	
	readonly eventName = GamesFullClearEvent.eventName

	static readonly eventName = 'GamesFullClearEvent'
}
