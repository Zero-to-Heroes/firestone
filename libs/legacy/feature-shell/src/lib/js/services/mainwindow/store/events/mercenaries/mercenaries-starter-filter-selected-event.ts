import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MercenariesStarterFilterType } from '../../../../../models/mercenaries/mercenaries-filter-types';

export class MercenariesStarterFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly starter: MercenariesStarterFilterType) {}

	public static eventName(): string {
		return 'MercenariesStarterFilterSelectedEvent';
	}

	public eventName(): string {
		return 'MercenariesStarterFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
