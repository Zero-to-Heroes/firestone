import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { ConstructedConfig } from '../../decktracker/constructed-config';
import { PatchInfo } from '../../patches';
import { ConstructedDeckbuilder } from './constructed-deckbuilder';
import { DeckFilters } from './deck-filters';

export class DecktrackerState {
	readonly filters: DeckFilters = new DeckFilters();
	readonly patch: PatchInfo;
	readonly isLoading: boolean = true;
	readonly deckbuilder: ConstructedDeckbuilder = new ConstructedDeckbuilder();
	readonly config: ConstructedConfig;
	readonly initComplete: boolean = false;

	public update(base: Partial<NonFunctionProperties<DecktrackerState>>): DecktrackerState {
		return Object.assign(new DecktrackerState(), this, base);
	}
}

export interface ConstructedDeckVersions {
	readonly versions: readonly ConstructedDeckVersion[];
}

export interface ConstructedDeckVersion {
	readonly deckstring: string;
	// Leave the option to name the version, or add comments
}
