import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesRoleFilterType } from '@firestone/mercenaries/common';

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
