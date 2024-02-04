import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class NavigationArena {
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';
	readonly expandedRunIds: readonly string[];

	public update(base: Partial<NonFunctionProperties<NavigationArena>>): NavigationArena {
		return Object.assign(new NavigationArena(), this, base);
	}
}
