import { MainWindowStoreEvent } from './main-window-store-event';

export class CurrentUserEvent implements MainWindowStoreEvent {
	constructor(public readonly currentUser: overwolf.profile.GetCurrentUserResult) {}

	public static eventName(): string {
		return 'CurrentUserEvent';
	}

	public eventName(): string {
		return 'CurrentUserEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
