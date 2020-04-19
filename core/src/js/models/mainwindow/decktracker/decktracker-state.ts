import { DeckFilters } from './deck-filters';
import { DeckSummary } from './deck-summary';

export class DecktrackerState {
	readonly filters: DeckFilters = new DeckFilters();
	readonly decks: readonly DeckSummary[];
	readonly isLoading: boolean = true;
}
