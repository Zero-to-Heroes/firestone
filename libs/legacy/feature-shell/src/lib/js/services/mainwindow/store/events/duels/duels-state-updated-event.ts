import { AdventuresInfo } from '@models/memory/memory-duels';
import { MainWindowStoreEvent } from '../main-window-store-event';

// Used to update reference data
export class DuelsStateUpdatedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsStateUpdatedEvent';
	}

	constructor(public readonly adventuresInfo: AdventuresInfo) {}

	public eventName(): string {
		return 'DuelsStateUpdatedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
