import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesHeroSearchEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MercenariesHeroSearchEvent';
	}

	constructor(public readonly value: string) {}

	public eventName(): string {
		return 'MercenariesHeroSearchEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
