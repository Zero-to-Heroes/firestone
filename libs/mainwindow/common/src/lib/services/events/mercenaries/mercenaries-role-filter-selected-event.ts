import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesRoleFilterType } from '@firestone/mercenaries/common';

export class MercenariesRoleFilterSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesRoleFilterSelectedEvent.eventName

	constructor(public readonly role: MercenariesRoleFilterType) {}

	static readonly eventName = 'MercenariesRoleFilterSelectedEvent'
}
