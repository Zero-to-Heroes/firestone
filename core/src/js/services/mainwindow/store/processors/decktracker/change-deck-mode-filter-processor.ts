import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { ChangeDeckModeFilterEvent } from '../../events/decktracker/change-deck-mode-filter-event';
import { Processor } from '../processor';

export class ChangeDeckModeFilterProcessor implements Processor {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly prefs: PreferencesService,
	) {}

	public async process(
		event: ChangeDeckModeFilterEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [null, null];
		// const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
		// 	gameFormat: currentState.decktracker.filters.gameFormat === 'standard' ? 'wild' : 'standard',
		// } as DeckFilters);
		// this.prefs.setDesktopDeckFilters(filters);
		// const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
		// 	filters: filters,
		// 	decks: this.decksStateBuilder.buildState(currentState.stats, filters),
		// } as DecktrackerState);
		// // TODO: this probably isn't split properly, but since we don't have any kind of navigation
		// // in the tracker part, I won't bother too much with it for now
		// return [
		// 	Object.assign(new MainWindowState(), currentState, {
		// 		decktracker: newState,
		// 	} as MainWindowState),
		// 	null,
		// ];
	}
}
