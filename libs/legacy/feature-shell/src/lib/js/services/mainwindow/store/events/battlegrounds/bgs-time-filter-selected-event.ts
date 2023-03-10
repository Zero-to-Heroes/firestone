import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsTimeFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly timeFilter: BgsActiveTimeFilterType) {}

	public static eventName(): string {
		return 'BgsTimeFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsTimeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
