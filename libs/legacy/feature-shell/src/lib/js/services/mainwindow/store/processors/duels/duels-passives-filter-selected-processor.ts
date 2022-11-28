import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../../../../models/preferences';
import { PreferencesService } from '../../../../preferences.service';
import { DuelsPassivesFilterSelectedEvent } from '../../events/duels/duels-passives-filter-selected-event';
import { Processor } from '../processor';

export class DuelsPassivesFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsPassivesFilterSelectedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, duelsActivePassiveTreasuresFilter: event.value };
		await this.prefs.savePreferences(newPrefs);
		return [null, null];
	}
}
