import { PreferencesService } from '@firestone/shared/common/service';
import {
	GenericPreferencesUpdateEvent,
	MainWindowState,
	NavigationState,
} from '../store-internal';
import { Processor } from './processor';

export class GenericPreferencesUpdateProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: GenericPreferencesUpdateEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const prefs = await this.prefs.getPreferences();
		const newPrefs = await event.patcher(prefs);
		await this.prefs.savePreferences(newPrefs);
		return [null, null];
	}
}
