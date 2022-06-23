import { NonFunctionProperties } from '../../../services/utils';
import { ConstructedConfig } from '../../decktracker/constructed-config';
import { PatchInfo } from '../../patches';
import { ConstructedDeckbuilder } from './constructed-deckbuilder';
import { DeckFilters } from './deck-filters';
import { DeckSummary } from './deck-summary';

export class DecktrackerState {
	readonly filters: DeckFilters = new DeckFilters();
	readonly showHiddenDecks: boolean = false;
	readonly decks: readonly DeckSummary[] = [];
	readonly patch: PatchInfo;
	readonly isLoading: boolean = true;
	readonly deckbuilder: ConstructedDeckbuilder = new ConstructedDeckbuilder();
	readonly config: ConstructedConfig;

	public update(base: Partial<NonFunctionProperties<DecktrackerState>>): DecktrackerState {
		return Object.assign(new DecktrackerState(), this, base);
	}
}
