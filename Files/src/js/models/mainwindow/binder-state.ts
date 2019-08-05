import { Set, SetCard } from '../set';
import { CardHistory } from '../card-history';

export class BinderState {
	readonly currentView: string = 'sets';
	readonly menuDisplayType: string = 'menu';
	readonly selectedFormat: string = 'standard';
	readonly allSets: readonly Set[] = [];
	readonly cardList: readonly SetCard[] = [];
	readonly selectedSet: Set;
	readonly selectedCard: SetCard;
	readonly searchString: string;
	readonly searchResults: readonly SetCard[] = [];
	readonly cardHistory: readonly CardHistory[] = [];
	readonly shownCardHistory: readonly CardHistory[] = [];
	readonly showOnlyNewCardsInHistory: boolean = false;
	readonly totalHistoryLength: number;
}
