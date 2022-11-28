import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeMatchStatsNumberOfTabsEvent implements MainWindowStoreEvent {
	constructor(public readonly tabsNumber: number) {}

	public static eventName(): string {
		return 'ChangeMatchStatsNumberOfTabsEvent';
	}

	public eventName(): string {
		return 'ChangeMatchStatsNumberOfTabsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
