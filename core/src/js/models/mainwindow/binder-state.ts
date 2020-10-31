import { CardHistory } from '../card-history';
import { Set, SetCard } from '../set';

export class BinderState {
	readonly allSets: readonly Set[] = [];
	readonly cardHistory: readonly CardHistory[] = [];
	readonly totalHistoryLength: number;
	readonly isLoading: boolean = true;

	public getCard(cardId: string): SetCard {
		return this.allSets.map(set => set.getCard(cardId)).find(card => card);
	}
}
