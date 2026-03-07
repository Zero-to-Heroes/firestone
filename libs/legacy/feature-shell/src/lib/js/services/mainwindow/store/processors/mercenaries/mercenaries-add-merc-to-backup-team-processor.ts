import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MercenariesAddMercToBackupTeamEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class MercenariesAddMercToBackupTeamProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesAddMercToBackupTeamEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const existingBackupTeam = prefs.mercenariesBackupTeam ?? [];
		const newBackupTeam = [...existingBackupTeam, event.mercId];
		const newPrefs: Preferences = { ...prefs, mercenariesBackupTeam: newBackupTeam };
		await this.prefs.savePreferences(newPrefs);
		return [null, null];
	}
}
