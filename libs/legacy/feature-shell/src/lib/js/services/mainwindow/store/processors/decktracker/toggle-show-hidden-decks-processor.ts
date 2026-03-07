import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { ToggleShowHiddenDecksEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class ToggleShowHiddenDecksProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ToggleShowHiddenDecksEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const newPrefs = await this.prefs.getPreferences();
		await this.prefs.savePreferences({ ...newPrefs, desktopDeckShowHiddenDecks: event.newValue });
		// FIXME: use generic prefs update event
		return [null, null];
	}
}
