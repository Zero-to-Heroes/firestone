import { CardHistory } from '../card-history';
import { Set, SetCard } from '../set';
import { CurrentView } from './collection/current-view.type';
import { StatGameFormatType } from './stats/stat-game-format.type';

export class BinderState {
	readonly currentView: CurrentView = 'sets';
	readonly menuDisplayType: string = 'menu';
	readonly selectedFormat: StatGameFormatType = 'standard';
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
	readonly isLoading: boolean = true;
}
