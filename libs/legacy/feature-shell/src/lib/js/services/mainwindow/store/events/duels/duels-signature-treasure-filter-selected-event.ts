import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsSignatureTreasureFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsSignatureTreasureFilterSelectedEvent';
	}

	constructor(public readonly values: readonly string[]) {}

	public eventName(): string {
		return 'DuelsSignatureTreasureFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
