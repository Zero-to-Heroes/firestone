import { MercenariesRoleFilterType } from '../../../../../models/mercenaries/mercenaries-role-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesRoleFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly role: MercenariesRoleFilterType) {}

	public static eventName(): string {
		return 'MercenariesRoleFilterSelectedEvent';
	}

	public eventName(): string {
		return 'MercenariesRoleFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
