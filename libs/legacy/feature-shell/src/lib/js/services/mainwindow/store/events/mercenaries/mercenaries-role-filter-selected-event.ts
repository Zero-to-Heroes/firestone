import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MercenariesRoleFilterType } from '../../../../../models/mercenaries/mercenaries-filter-types';

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
