import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
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
