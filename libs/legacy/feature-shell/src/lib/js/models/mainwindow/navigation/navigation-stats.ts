import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { StatsCategoryType } from '../stats/stats-category';

export class NavigationStats {
	readonly selectedCategoryId: StatsCategoryType = 'xp-graph';
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';

	public update(base: Partial<NonFunctionProperties<NavigationStats>>): NavigationStats {
		return Object.assign(new NavigationStats(), this, base);
	}

	public getPageName(): string {
		return this.selectedCategoryId;
	}
}
