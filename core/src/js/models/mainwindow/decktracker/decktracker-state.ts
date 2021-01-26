import { PatchInfo } from '../../patches';
import { DeckFilters } from './deck-filters';
import { DeckSummary } from './deck-summary';

export class DecktrackerState {
	readonly filters: DeckFilters = new DeckFilters();
	readonly showHiddenDecks: boolean = false;
	readonly decks: readonly DeckSummary[];
	readonly patch: PatchInfo;
	readonly isLoading: boolean = true;
}
