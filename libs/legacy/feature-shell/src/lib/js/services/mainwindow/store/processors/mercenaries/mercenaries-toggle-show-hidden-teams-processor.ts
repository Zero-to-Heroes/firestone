import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MercenariesToggleShowHiddenTeamsEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class MercenariesToggleShowHiddenTeamsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesToggleShowHiddenTeamsEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateMercenariesShowHiddenTeams(event.newValue);
		return [null, null];
	}
}
