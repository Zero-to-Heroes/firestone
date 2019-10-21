import { DeckFilters } from './deck-filters';
import { DeckSummary } from './deck-summary';
import { DecktrackerViewType } from './decktracker-view.type';
import { ReplaysState } from './replays-state';

export class DecktrackerState {
	readonly currentView: DecktrackerViewType = 'decks';
	readonly menuDisplayType: string = 'menu';
	readonly filters: DeckFilters = new DeckFilters();
	readonly decks: readonly DeckSummary[];
	readonly replayState: ReplaysState = new ReplaysState();
}
