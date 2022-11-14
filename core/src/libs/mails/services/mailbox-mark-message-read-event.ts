import { MainWindowStoreEvent } from '../../../js/services/mainwindow/store/events/main-window-store-event';

export class MailboxMarkMessageReadEvent implements MainWindowStoreEvent {
	constructor(public readonly eventId: string) {}

	public static eventName(): string {
		return 'MailboxMarkMessageReadEvent';
	}

	public eventName(): string {
		return 'MailboxMarkMessageReadEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
