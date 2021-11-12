import { SetCard } from '../../set';
import { CurrentView } from '../collection/current-view.type';

export class NavigationCollection {
	readonly currentView: CurrentView = 'sets';
	readonly menuDisplayType: string = 'menu';
	readonly selectedSetId: string;
	readonly selectedCardId: string;
	readonly selectedCardBackId: number;
	readonly searchString: string;
	readonly searchResults: readonly string[] = [];
	readonly cardList: readonly SetCard[] = [];

	public update(base: NavigationCollection): NavigationCollection {
		return Object.assign(new NavigationCollection(), this, base);
	}

	public getPageName(): string {
		return this.currentView;
	}
}
