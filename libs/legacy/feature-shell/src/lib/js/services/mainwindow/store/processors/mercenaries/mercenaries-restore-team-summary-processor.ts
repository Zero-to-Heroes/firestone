import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesRestoreTeamSummaryEvent } from '../../events/mercenaries/mercenaries-restore-team-summary-event';
import { Processor } from '../processor';

export class MercenariesRestoreTeamSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesRestoreTeamSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenTeams = (currentPrefs.mercenariesHiddenTeamIds ?? []).filter(
			(teamId) => teamId !== event.teamId,
		);
		await this.prefs.updateMercenariesHiddenTeamIds(newHiddenTeams);
		return [null, null];
	}
}
