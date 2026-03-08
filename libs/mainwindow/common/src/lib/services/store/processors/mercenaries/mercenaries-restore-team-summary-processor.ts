import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesRestoreTeamSummaryEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesRestoreTeamSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesRestoreTeamSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenTeams = (currentPrefs.mercenariesHiddenTeamIds ?? []).filter(
			(teamId) => teamId !== event.teamId,
		);
		await this.prefs.updateMercenariesHiddenTeamIds(newHiddenTeams);
		return [null, null];
	}
}
