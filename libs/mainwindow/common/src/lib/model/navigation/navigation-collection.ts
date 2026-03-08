import { SetCard } from '@firestone/collection/common';
import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class NavigationCollection {
	readonly searchResults: readonly string[] = [];
	readonly cardList: readonly SetCard[] = [];

	public update(base: Partial<NonFunctionProperties<NavigationCollection>>): NavigationCollection {
		return Object.assign(new NavigationCollection(), this, base);
	}
}
