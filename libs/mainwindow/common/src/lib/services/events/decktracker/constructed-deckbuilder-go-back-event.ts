import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderGoBackEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedDeckbuilderGoBackEvent.eventName

	static readonly eventName = 'ConstructedDeckbuilderGoBackEvent'

	constructor(public readonly step: 'format' | 'class') {}
}
