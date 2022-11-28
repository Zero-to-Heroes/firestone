import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowCardBackDetailsEvent implements MainWindowStoreEvent {
	constructor(public readonly cardBackId: number) {}

	public static eventName(): string {
		return 'ShowCardBackDetailsEvent';
	}

	public eventName(): string {
		return 'ShowCardBackDetailsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
