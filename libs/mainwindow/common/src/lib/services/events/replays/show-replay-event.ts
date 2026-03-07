import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowReplayEvent implements MainWindowStoreEvent {
	constructor(public readonly reviewId: string) {}

	public static eventName(): string {
		return 'ShowReplayEvent';
	}

	public eventName(): string {
		return 'ShowReplayEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
