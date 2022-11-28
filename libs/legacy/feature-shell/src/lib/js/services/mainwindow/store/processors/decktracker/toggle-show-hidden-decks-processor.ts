import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { ToggleShowHiddenDecksEvent } from '../../events/decktracker/toggle-show-hidden-decks-event';
import { Processor } from '../processor';

export class ToggleShowHiddenDecksProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ToggleShowHiddenDecksEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newPrefs = await this.prefs.getPreferences();
		await this.prefs.savePreferences({ ...newPrefs, desktopDeckShowHiddenDecks: event.newValue });
		// FIXME: use generic prefs update event
		return [null, null];
	}
}
