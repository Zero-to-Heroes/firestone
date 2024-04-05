import { SetCard } from '../../set';

export class NavigationCollection {
	readonly searchResults: readonly string[] = [];
	readonly cardList: readonly SetCard[] = [];

	public update(base: NavigationCollection): NavigationCollection {
		return Object.assign(new NavigationCollection(), this, base);
	}
}
