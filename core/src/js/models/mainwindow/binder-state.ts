import { CardHistory } from '../card-history';
import { Set } from '../set';

export class BinderState {
	readonly allSets: readonly Set[] = [];
	readonly cardHistory: readonly CardHistory[] = [];
	readonly totalHistoryLength: number;
	readonly isLoading: boolean = true;
}
