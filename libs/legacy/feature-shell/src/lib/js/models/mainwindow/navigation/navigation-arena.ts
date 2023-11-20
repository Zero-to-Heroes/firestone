import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { ArenaCategoryType } from '../arena/arena-category.type';

export class NavigationArena {
	readonly selectedCategoryId: ArenaCategoryType = 'arena-runs';
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';
	readonly expandedRunIds: readonly string[];

	public update(base: Partial<NonFunctionProperties<NavigationArena>>): NavigationArena {
		return Object.assign(new NavigationArena(), this, base);
	}

	public getPageName(): string {
		return this.selectedCategoryId;
	}
}
