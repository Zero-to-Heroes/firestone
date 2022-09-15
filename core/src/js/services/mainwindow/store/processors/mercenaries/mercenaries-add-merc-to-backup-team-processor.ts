import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../../../../models/preferences';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesAddMercToBackupTeamEvent } from '../../events/mercenaries/mercenaries-add-merc-to-backup-team-event';
import { Processor } from '../processor';

export class MercenariesAddMercToBackupTeamProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesAddMercToBackupTeamEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const existingBackupTeam = prefs.mercenariesBackupTeam ?? [];
		const newBackupTeam = [...existingBackupTeam, event.mercId];
		const newPrefs: Preferences = { ...prefs, mercenariesBackupTeam: newBackupTeam };
		await this.prefs.savePreferences(newPrefs);
		return [null, null];
	}
}
