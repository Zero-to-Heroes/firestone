import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesRemoveMercToBackupTeamEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesRemoveMercToBackupTeamProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesRemoveMercToBackupTeamEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const prefs = await this.prefs.getPreferences();
		const existingBackupTeam = prefs.mercenariesBackupTeam ?? [];
		const newBackupTeam = existingBackupTeam.filter((mercId) => mercId !== event.mercId);
		const newPrefs: Preferences = { ...prefs, mercenariesBackupTeam: newBackupTeam };
		await this.prefs.savePreferences(newPrefs);
		return [null, null];
	}
}
