import { DeckFilters } from './deck-filters';
import { DeckSummary } from './deck-summary';
import { DecktrackerViewType } from './decktracker-view.type';

export class DecktrackerState {
	readonly currentView: DecktrackerViewType = 'decks';
	readonly menuDisplayType: string = 'menu';
	readonly filters: DeckFilters = new DeckFilters();
	readonly decks: readonly DeckSummary[];
}
