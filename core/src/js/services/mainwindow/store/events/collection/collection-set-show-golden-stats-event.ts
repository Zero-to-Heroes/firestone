import { MainWindowStoreEvent } from '../main-window-store-event';

export class CollectionSetShowGoldenStatsEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'CollectionSetShowGoldenStatsEvent';
	}

	constructor(public readonly newValue: boolean) {}

	public eventName(): string {
		return 'CollectionSetShowGoldenStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
