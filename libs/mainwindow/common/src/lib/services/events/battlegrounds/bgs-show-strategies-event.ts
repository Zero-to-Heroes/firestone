import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsShowStrategiesEvent implements MainWindowStoreEvent {
	
	readonly eventName = BgsShowStrategiesEvent.eventName

	constructor(public readonly heroId: string) {}

	static readonly eventName = 'BgsShowStrategiesEvent'
}
