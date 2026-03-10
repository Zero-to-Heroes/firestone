import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesHeroSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesHeroSelectedEvent.eventName

	constructor(public readonly heroId: string) {}

	static readonly eventName = 'MercenariesHeroSelectedEvent'
}
