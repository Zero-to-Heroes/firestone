import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { Mail } from '../mail-state';

export class MailboxMarkMessageReadEvent implements MainWindowStoreEvent {
	
	readonly eventName = MailboxMarkMessageReadEvent.eventName

	constructor(public readonly message: Mail) {}

	static readonly eventName = 'MailboxMarkMessageReadEvent'
}
