import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesStarterFilterType } from '@firestone/mercenaries/common';

export class MercenariesStarterFilterSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesStarterFilterSelectedEvent.eventName

	constructor(public readonly starter: MercenariesStarterFilterType) {}

	static readonly eventName = 'MercenariesStarterFilterSelectedEvent'
}
