import { PackResult } from '@firestone-hs/retrieve-pack-stats';
import { Card } from '../card';
import { CardBack } from '../card-back';
import { CardHistory } from '../card-history';
import { Coin } from '../coin';
import { PackInfo } from '../collection/pack-info';
import { Set, SetCard } from '../set';

export class BinderState {
	readonly collection: readonly Card[] = [];
	readonly packs: readonly PackInfo[];
	readonly packStats: readonly PackResult[];
	readonly allSets: readonly Set[] = [];
	readonly cardBacks: readonly CardBack[] = [];
	readonly coins: readonly Coin[] = [];
	readonly cardHistory: readonly CardHistory[] = [];
	readonly totalHistoryLength: number;
	readonly isLoading: boolean = true;

	public update(base: BinderState): BinderState {
		return Object.assign(new BinderState(), this, base);
	}

	public getCard(cardId: string): SetCard {
		return this.allSets.map((set) => set.getCard(cardId)).find((card) => card);
	}

	public getAllCards(): readonly SetCard[] {
		return this.allSets.map((set) => set.allCards).reduce((a, b) => a.concat(b), []);
	}
}
