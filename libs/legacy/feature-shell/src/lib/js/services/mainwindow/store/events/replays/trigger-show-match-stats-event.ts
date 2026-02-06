import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
