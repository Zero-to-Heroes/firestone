import { MercenariesStarterFilterType } from '../../../../../models/mercenaries/mercenaries-filter-types';
import { MainWindowStoreEvent } from '../main-window-store-event';

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
