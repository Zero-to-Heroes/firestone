import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesHideTeamSummaryEvent } from '../../events/mercenaries/mercenaries-hide-team-summary-event';
import { Processor } from '../processor';

export class MercenariesHideTeamSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesHideTeamSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenTeams = [...currentPrefs.mercenariesHiddenTeamIds, event.teamId];
		await this.prefs.updateMercenariesHiddenTeamIds(newHiddenTeams);
		return [null, null];
	}
}
