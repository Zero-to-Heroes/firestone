import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsHeroFilterSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = BgsHeroFilterSelectedEvent.eventName

	constructor(public readonly heroFilter: string) {}

	static readonly eventName = 'BgsHeroFilterSelectedEvent'
}
