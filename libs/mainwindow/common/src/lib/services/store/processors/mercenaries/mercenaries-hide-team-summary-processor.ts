import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesHideTeamSummaryEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesHideTeamSummaryProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesHideTeamSummaryEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenTeams = [...currentPrefs.mercenariesHiddenTeamIds, event.teamId];
		await this.prefs.updateMercenariesHiddenTeamIds(newHiddenTeams);
		return [null, null];
	}
}
