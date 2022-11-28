import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesHideTeamSummaryEvent } from '../../events/mercenaries/mercenaries-hide-team-summary-event';
import { Processor } from '../processor';

export class MercenariesHideTeamSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesHideTeamSummaryEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenTeams = [...currentPrefs.mercenariesHiddenTeamIds, event.teamId];
		console.debug('newHiddenTeams', newHiddenTeams);
		await this.prefs.updateMercenariesHiddenTeamIds(newHiddenTeams);
		return [null, null];
	}
}
