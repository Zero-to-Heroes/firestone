import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderClassSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedDeckbuilderClassSelectedEvent.eventName

	static readonly eventName = 'ConstructedDeckbuilderClassSelectedEvent'

	constructor(public readonly playerClass: string) {}
}
