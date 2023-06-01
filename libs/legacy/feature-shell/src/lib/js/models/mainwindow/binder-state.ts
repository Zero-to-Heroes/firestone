import { PackResult } from '@firestone-hs/user-packs';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardHistory } from '../card-history';

export class BinderState {
	// readonly collection: readonly Card[] = [];
	// readonly ownedBgsHeroSkins: readonly number[] = [];
	// readonly packsFromMemory: readonly PackInfo[] = [];
	readonly packStats: readonly PackResult[] = [];
	// readonly allSets: readonly Set[] = [];
	// readonly cardBacks: readonly CardBack[] = [];
	// readonly coins: readonly Coin[] = [];
	readonly cardHistory: readonly CardHistory[] = [];
	readonly totalHistoryLength: number;
	readonly isLoading: boolean = false;

	public static create(base: Partial<NonFunctionProperties<BinderState>>): BinderState {
		return Object.assign(new BinderState(), base);
	}

	public update(base: Partial<NonFunctionProperties<BinderState>>): BinderState {
		return Object.assign(new BinderState(), this, base);
	}
}
