import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	NavigationState,
	ToggleShowHiddenDecksEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class ToggleShowHiddenDecksProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ToggleShowHiddenDecksEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const newPrefs = await this.prefs.getPreferences();
		await this.prefs.savePreferences({ ...newPrefs, desktopDeckShowHiddenDecks: event.newValue });
		// FIXME: use generic prefs update event
		return [null, null];
	}
}
