import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { Processor } from '../../../js/services/mainwindow/store/processors/processor';
import { MailboxMarkMessageReadEvent } from './mailbox-mark-message-read-event';

export class MailboxMarkMessageReadProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MailboxMarkMessageReadEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		// if (prefs.mailboxLastVisitDate < new Date(event.message.date)) {
		const newPrefs = await this.prefs.savePreferences({
			...prefs,
			mailboxLastVisitDate: new Date(event.message.date),
		} as Preferences);
		// }
		return [null, null];
	}
}
