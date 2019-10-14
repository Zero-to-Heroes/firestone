import { CurrentUser } from '../../../../models/overwolf/profile/current-user';
import { MainWindowStoreEvent } from './main-window-store-event';

export class CurrentUserEvent implements MainWindowStoreEvent {
	constructor(public readonly currentUser: CurrentUser) {}

	public static eventName(): string {
		return 'CurrentUserEvent';
	}

	public eventName(): string {
		return 'CurrentUserEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
