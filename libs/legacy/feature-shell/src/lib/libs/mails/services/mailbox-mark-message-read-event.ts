import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { Mail } from '../mail-state';

export class MailboxMarkMessageReadEvent implements MainWindowStoreEvent {
	constructor(public readonly message: Mail) {}

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
