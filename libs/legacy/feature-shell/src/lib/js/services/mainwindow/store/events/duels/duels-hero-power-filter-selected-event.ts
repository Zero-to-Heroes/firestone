import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsHeroPowerFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsHeroPowerFilterSelectedEvent';
	}

	constructor(public readonly value: readonly string[]) {}

	public eventName(): string {
		return 'DuelsHeroPowerFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
