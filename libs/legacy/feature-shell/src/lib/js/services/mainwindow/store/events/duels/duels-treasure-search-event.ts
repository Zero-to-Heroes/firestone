import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTreasureSearchEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTreasureSearchEvent';
	}

	constructor(public readonly value: string) {}

	public eventName(): string {
		return 'DuelsTreasureSearchEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
