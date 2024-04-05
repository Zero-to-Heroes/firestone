import { SetCard } from '../../set';

export class NavigationCollection {
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
}
