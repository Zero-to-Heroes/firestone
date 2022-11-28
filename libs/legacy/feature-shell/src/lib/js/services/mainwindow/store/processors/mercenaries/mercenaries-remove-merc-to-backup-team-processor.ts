import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../../../../models/preferences';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesRemoveMercToBackupTeamEvent } from '../../events/mercenaries/mercenaries-remove-merc-to-backup-team-event';
import { Processor } from '../processor';

export class MercenariesRemoveMercToBackupTeamProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesRemoveMercToBackupTeamEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const existingBackupTeam = prefs.mercenariesBackupTeam ?? [];
		const newBackupTeam = existingBackupTeam.filter((mercId) => mercId !== event.mercId);
		const newPrefs: Preferences = { ...prefs, mercenariesBackupTeam: newBackupTeam };
		await this.prefs.savePreferences(newPrefs);
		return [null, null];
	}
}
