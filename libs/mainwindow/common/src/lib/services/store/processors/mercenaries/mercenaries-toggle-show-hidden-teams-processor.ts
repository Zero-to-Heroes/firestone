import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MercenariesToggleShowHiddenTeamsEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesToggleShowHiddenTeamsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesToggleShowHiddenTeamsEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		await this.prefs.updateMercenariesShowHiddenTeams(event.newValue);
		return [null, null];
	}
}
