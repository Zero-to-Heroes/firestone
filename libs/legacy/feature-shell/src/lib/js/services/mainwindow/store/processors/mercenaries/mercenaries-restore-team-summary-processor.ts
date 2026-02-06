import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
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
