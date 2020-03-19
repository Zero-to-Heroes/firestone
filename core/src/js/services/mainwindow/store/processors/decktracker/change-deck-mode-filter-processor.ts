import { DeckFilters } from '../../../../../models/mainwindow/decktracker/deck-filters';
import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { ChangeDeckModeFilterEvent } from '../../events/decktracker/change-deck-mode-filter-event';
import { Processor } from '../processor';

export class ChangeDeckModeFilterProcessor implements Processor {
	constructor(private readonly decksStateBuilder: DecksStateBuilderService) {}

	public async process(event: ChangeDeckModeFilterEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const filters = Object.assign(new DeckFilters(), currentState.decktracker.filters, {
			gameFormat: currentState.decktracker.filters.gameFormat === 'standard' ? 'wild' : 'standard',
		} as DeckFilters);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			filters: filters,
			decks: this.decksStateBuilder.buildState(currentState.stats, filters),
		} as DecktrackerState);
		return Object.assign(new MainWindowState(), currentState, {
			decktracker: newState,
		} as MainWindowState);
	}
}
