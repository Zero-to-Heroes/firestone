import { MainWindowStoreEvent } from '../main-window-store-event';

export class GamesFullRefreshEvent implements MainWindowStoreEvent {
	
	readonly eventName = GamesFullRefreshEvent.eventName

	static readonly eventName = 'GamesFullRefreshEvent'
}
