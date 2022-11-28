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
		console.debug('personal decks', currentPrefs.constructedPersonalAdditionalDecks);
		const existingPersonalDeck = currentPrefs.constructedPersonalAdditionalDecks
			.filter((d) => d.deckstring)
			.find((d) => d.deckstring === event.deckstring);

		// If the deck has only been created via the deckbuilder and has not been played yet,
		// we simply remove it
		// That way, we can easily add it again
		if (existingPersonalDeck) {
			const newPersonalDecks = currentPrefs.constructedPersonalAdditionalDecks.filter(
				(d) => d.deckstring !== event.deckstring,
			);
			const newPrefs = { ...currentPrefs, constructedPersonalAdditionalDecks: newPersonalDecks };
			await this.prefs.savePreferences(newPrefs);
		}

		// If no games were played with the deck, no need to change anything
		const gamesWithDeck = currentState.stats.gameStats.stats.filter((s) => s.playerDecklist === event.deckstring);
		if (!gamesWithDeck.length) {
			return [
				null,
				navigationState.update({
					navigationDecktracker: navigationState.navigationDecktracker.update({
						currentView: 'decks',
					} as NavigationDecktracker),
				} as NavigationState),
			];
		}

		const deletedDeckDates: readonly number[] = currentPrefs.desktopDeckDeletes[event.deckstring] ?? [];
		console.log('[deck-delete] deletedDeckDates', event.deckstring, deletedDeckDates);
		const newDeleteDates: readonly number[] = [Date.now(), ...deletedDeckDates];
		console.log('[deck-delete] newDeleteDates', newDeleteDates);
		await this.prefs.setDeckDeleteDates(event.deckstring, newDeleteDates);
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
