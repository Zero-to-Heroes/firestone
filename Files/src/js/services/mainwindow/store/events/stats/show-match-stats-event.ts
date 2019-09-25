import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowMatchStatsEvent implements MainWindowStoreEvent {
	constructor(readonly reviewId: string) {}

	public static eventName(): string {
		return 'ShowMatchStatsEvent';
	}

	public eventName(): string {
		return 'ShowMatchStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
