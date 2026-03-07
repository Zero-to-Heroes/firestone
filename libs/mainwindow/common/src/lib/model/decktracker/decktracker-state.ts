import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { ConstructedDeckbuilder } from './constructed-deckbuilder';

export class DecktrackerState {
	readonly isLoading: boolean = true;
	readonly deckbuilder: ConstructedDeckbuilder = new ConstructedDeckbuilder();
	readonly initComplete: boolean = false;

	public static create(base: Partial<NonFunctionProperties<DecktrackerState>>): DecktrackerState {
		return Object.assign(new DecktrackerState(), base);
	}

	public update(base: Partial<NonFunctionProperties<DecktrackerState>>): DecktrackerState {
		return Object.assign(new DecktrackerState(), this, base);
	}
}
