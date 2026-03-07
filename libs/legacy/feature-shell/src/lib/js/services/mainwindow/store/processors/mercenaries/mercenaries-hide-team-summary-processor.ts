import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MercenariesHideTeamSummaryEvent } from '@firestone/mainwindow/common';
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
