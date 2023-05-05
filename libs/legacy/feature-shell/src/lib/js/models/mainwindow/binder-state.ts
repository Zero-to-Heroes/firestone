import { PackResult } from '@firestone-hs/user-packs';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { Card } from '../card';
import { CardBack } from '../card-back';
import { CardHistory } from '../card-history';
import { Coin } from '../coin';
import { PackInfo } from '../collection/pack-info';
import { Set, SetCard } from '../set';

export class BinderState {
	readonly collection: readonly Card[] = [];
	readonly ownedBgsHeroSkins: readonly number[] = [];
	readonly packsFromMemory: readonly PackInfo[] = [];
	readonly packStats: readonly PackResult[] = [];
	readonly allSets: readonly Set[] = [];
	readonly cardBacks: readonly CardBack[] = [];
	readonly coins: readonly Coin[] = [];
	readonly cardHistory: readonly CardHistory[] = [];
	readonly totalHistoryLength: number;
	readonly isLoading: boolean = true;

	public static create(base: Partial<NonFunctionProperties<BinderState>>): BinderState {
		return Object.assign(new BinderState(), base);
	}

	public update(base: Partial<NonFunctionProperties<BinderState>>): BinderState {
		return Object.assign(new BinderState(), this, base);
	}

	public getCard(cardId: string): SetCard {
		return this.allSets.map((set) => set.getCard(cardId)).find((card) => card);
	}

	public getAllCards(): readonly SetCard[] {
		return this.allSets.map((set) => set.allCards).reduce((a, b) => a.concat(b), []);
	}
}
