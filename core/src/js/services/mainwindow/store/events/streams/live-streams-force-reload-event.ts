import { MainWindowStoreEvent } from '../main-window-store-event';

export class LiveStreamsForceReloadEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'LiveStreamsForceReloadEvent';
	}

	public eventName(): string {
		return 'LiveStreamsForceReloadEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
