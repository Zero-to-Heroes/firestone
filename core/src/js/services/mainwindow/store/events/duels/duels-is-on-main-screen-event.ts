import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsIsOnMainScreenEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsIsOnMainScreenEvent';
	}

	constructor(public readonly value: boolean) {}

	public eventName(): string {
		return 'DuelsIsOnMainScreenEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
