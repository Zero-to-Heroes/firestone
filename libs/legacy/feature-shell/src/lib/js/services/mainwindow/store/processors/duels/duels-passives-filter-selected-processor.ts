import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsPassivesFilterSelectedEvent } from '../../events/duels/duels-passives-filter-selected-event';
import { Processor } from '../processor';

export class DuelsPassivesFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsPassivesFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, duelsActivePassiveTreasuresFilter: event.value };
		await this.prefs.savePreferences(newPrefs);
		return [null, null];
	}
}
