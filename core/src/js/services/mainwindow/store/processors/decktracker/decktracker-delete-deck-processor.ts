import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDecktracker } from '../../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { DecktrackerDeleteDeckEvent } from '../../events/decktracker/decktracker-delete-deck-event';
import { Processor } from '../processor';

export class DecktrackerDeleteDeckProcessor implements Processor {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly prefs: PreferencesService,
		private readonly replaysBuilder: ReplaysStateBuilderService,
	) {}

	public async process(
		event: DecktrackerDeleteDeckEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		console.log(
			'[deck-delete] deck before deletion',
			currentState.decktracker.decks.find((deck) => deck.deckstring === event.deckstring),
		);
		const deletedDeckDates: readonly number[] = currentPrefs.desktopDeckDeletes[event.deckstring] ?? [];
		console.log('[deck-delete] deletedDeckDates', event.deckstring, deletedDeckDates);
		const newDeleteDates: readonly number[] = [Date.now(), ...deletedDeckDates];
		console.log('[deck-delete] newDeleteDates', newDeleteDates);
		const newPrefs = await this.prefs.setDeckDeleteDates(event.deckstring, newDeleteDates);
		console.log('[deck-delete] newPrefs', newPrefs.desktopDeckDeletes[event.deckstring]);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			decks: this.decksStateBuilder.buildState(
				currentState.stats,
				currentState.decktracker.filters,
				currentState.decktracker.patch,
				newPrefs,
			),
		} as DecktrackerState);
		console.log(
			'[deck-delete] deck after deletion',
			newState.decks.find((deck) => deck.deckstring === event.deckstring),
		);
		const replays = await this.replaysBuilder.buildState(currentState.replays, currentState.stats, newState.decks);
		return [
			Object.assign(new MainWindowState(), currentState, {
				decktracker: newState,
				replays: replays,
			} as MainWindowState),
			navigationState.update({
				navigationDecktracker: navigationState.navigationDecktracker.update({
					currentView: 'decks',
				} as NavigationDecktracker),
			} as NavigationState),
		];
	}
}
