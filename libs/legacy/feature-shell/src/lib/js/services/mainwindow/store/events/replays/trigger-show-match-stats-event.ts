import { MainWindowStoreEvent } from '../main-window-store-event';

export class TriggerShowMatchStatsEvent implements MainWindowStoreEvent {
	constructor(public readonly reviewId: string) {}

	public static eventName(): string {
		return 'TriggerShowMatchStatsEvent';
	}

	public eventName(): string {
		return 'TriggerShowMatchStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
