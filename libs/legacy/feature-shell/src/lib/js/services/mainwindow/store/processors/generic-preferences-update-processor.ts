import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { GenericPreferencesUpdateEvent } from '../events/generic-preferences-update-event';
import { Processor } from './processor';

export class GenericPreferencesUpdateProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: GenericPreferencesUpdateEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const newPrefs = await event.patcher(prefs);
		await this.prefs.savePreferences(newPrefs);
		return [null, null];
	}
}
