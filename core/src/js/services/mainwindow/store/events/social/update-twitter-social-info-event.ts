import { MainWindowStoreEvent } from '../main-window-store-event';

export class UpdateTwitterSocialInfoEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'UpdateTwitterSocialInfoEvent';
	}

	public eventName(): string {
		return 'UpdateTwitterSocialInfoEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
