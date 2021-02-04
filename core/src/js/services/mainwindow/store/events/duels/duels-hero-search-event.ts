import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsHeroSearchEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsHeroSearchEvent';
	}

	constructor(public readonly value: string) {}

	public eventName(): string {
		return 'DuelsHeroSearchEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
