import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ToggleShowHiddenDecksEvent } from '../../events/decktracker/toggle-show-hidden-decks-event';
import { Processor } from '../processor';

export class ToggleShowHiddenDecksProcessor implements Processor {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly prefs: PreferencesService,
		private readonly replaysBuilder: ReplaysStateBuilderService,
	) {}

	public async process(
		event: ToggleShowHiddenDecksEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newPrefs = await this.prefs.getPreferences();
		// const newPrefs = await this.prefs.setValue('desktopDeckShowHiddenDecks', event.newValue);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			decks: this.decksStateBuilder.buildState(
				currentState.stats,
				currentState.decktracker.filters,
				currentState.decktracker.patch,
				newPrefs,
			),
			showHiddenDecks: event.newValue,
		} as DecktrackerState);
		return [
			currentState.update({
				decktracker: newState,
			} as MainWindowState),
			null,
		];
	}
}
