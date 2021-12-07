import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesViewMercDetailsEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MercenariesViewMercDetailsEvent';
	}

	constructor(public readonly mercenaryId: number) {}

	public eventName(): string {
		return 'MercenariesViewMercDetailsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
