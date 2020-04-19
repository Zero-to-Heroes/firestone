import { CardHistory } from '../../card-history';
import { Set, SetCard } from '../../set';
import { CurrentView } from '../collection/current-view.type';
import { StatGameFormatType } from '../stats/stat-game-format.type';

export class NavigationCollection {
	readonly currentView: CurrentView = 'sets';
	readonly menuDisplayType: string = 'menu';
	readonly selectedFormat: StatGameFormatType = 'standard';
	readonly selectedSet: Set;
	readonly selectedCard: SetCard;
	readonly searchString: string;
	readonly searchResults: readonly SetCard[] = [];
	readonly cardList: readonly SetCard[] = [];
	readonly shownCardHistory: readonly CardHistory[] = [];
	readonly showOnlyNewCardsInHistory: boolean = false;

	public update(base: NavigationCollection): NavigationCollection {
		return Object.assign(new NavigationCollection(), this, base);
	}
}
