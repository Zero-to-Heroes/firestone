import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ToggleShowHiddenDecksEvent } from '../../events/decktracker/toggle-show-hidden-decks-event';
import { Processor } from '../processor';

export class ToggleShowHiddenDecksProcessor implements Processor {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly prefs: PreferencesService,
	) {}

	public async process(
		event: ToggleShowHiddenDecksEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newToggle = !currentPrefs.desktopDeckShowHiddenDecks;
		const newPrefs = await this.prefs.setValue('desktopDeckShowHiddenDecks', newToggle);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			decks: this.decksStateBuilder.buildState(currentState.stats, currentState.decktracker.filters, newPrefs),
			showHiddenDecks: newToggle,
		} as DecktrackerState);
		return [
			Object.assign(new MainWindowState(), currentState, {
				decktracker: newState,
			} as MainWindowState),
			null,
		];
	}
}
