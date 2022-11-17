import { MainWindowState } from '../../../js/models/mainwindow/main-window-state';
import { NavigationState } from '../../../js/models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../../js/models/preferences';
import { Processor } from '../../../js/services/mainwindow/store/processors/processor';
import { PreferencesService } from '../../../js/services/preferences.service';
import { MailboxMarkMessageReadEvent } from './mailbox-mark-message-read-event';

export class MailboxMarkMessageReadProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MailboxMarkMessageReadEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		// if (prefs.mailboxLastVisitDate < new Date(event.message.date)) {
		console.debug('[mailbox] will save last update date', prefs.mailboxLastVisitDate, event.message);
		const newPrefs = await this.prefs.savePreferences({
			...prefs,
			mailboxLastVisitDate: new Date(event.message.date),
		} as Preferences);
		console.debug('[mailbox] after save', newPrefs.mailboxLastVisitDate);
		// }
		return [null, null];
	}
}
