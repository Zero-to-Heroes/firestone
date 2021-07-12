import { ArenaClassFilterType } from '../../../../../models/arena/arena-class-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ArenaClassFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ArenaClassFilterSelectedEvent';
	}

	constructor(public readonly value: ArenaClassFilterType) {}

	public eventName(): string {
		return 'ArenaClassFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
