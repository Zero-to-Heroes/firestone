import { DeckStat } from '@firestone-hs/deck-stats';
import { AppInjector } from '../../../services/app-injector';
import { LazyDataInitService } from '../../../services/lazy-data-init.service';
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

	// I couldn't find a way to disable accessing the property directly (force a getter) while
	// also keeping the property easy to set via Object.assign.
	// (getter and setter have the same visibility in Typescript, and I can't have complex logic in the getter)
	// because it gets called by Object.assign
	// Important to assign it to null, so that we only call the LazyInit once
	readonly metaDecks: readonly DeckStat[] = null;

	public update(base: Partial<NonFunctionProperties<DecktrackerState>>): DecktrackerState {
		return Object.assign(new DecktrackerState(), this, base);
	}

	public getMetaDecks(): readonly DeckStat[] {
		if (this.metaDecks === null) {
			console.log('meta decks not initialized yet');
			(this.metaDecks as readonly DeckStat[]) = [];
			AppInjector.get<LazyDataInitService>(LazyDataInitService).requestLoad('constructed-meta-decks');
		}
		return this.metaDecks;
	}
}
