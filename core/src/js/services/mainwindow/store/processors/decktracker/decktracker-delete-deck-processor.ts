import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDecktracker } from '../../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { DecktrackerDeleteDeckEvent } from '../../events/decktracker/decktracker-delete-deck-event';
import { Processor } from '../processor';

export class DecktrackerDeleteDeckProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DecktrackerDeleteDeckEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const deletedDeckDates: readonly number[] = currentPrefs.desktopDeckDeletes[event.deckstring] ?? [];
		console.log('[deck-delete] deletedDeckDates', event.deckstring, deletedDeckDates);
		const newDeleteDates: readonly number[] = [Date.now(), ...deletedDeckDates];
		console.log('[deck-delete] newDeleteDates', newDeleteDates);
		const newPrefs = await this.prefs.setDeckDeleteDates(event.deckstring, newDeleteDates);
		console.log('[deck-delete] newPrefs', newPrefs.desktopDeckDeletes[event.deckstring]);
		return [
			null,
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					currentView: 'decks',
				} as NavigationDecktracker),
			} as NavigationState),
		];
	}
}
