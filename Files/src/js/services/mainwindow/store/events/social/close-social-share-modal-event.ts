import { MainWindowStoreEvent } from '../main-window-store-event';

export class CloseSocialShareModalEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'CloseSocialShareModalEvent';
	}

	public eventName(): string {
		return 'CloseSocialShareModalEvent';
	}
}
