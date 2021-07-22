import { StatsCategoryType } from '../stats/stats-category.type';

export class NavigationStats {
	readonly selectedCategoryId: StatsCategoryType = 'xp-graph';
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';

	public update(base: NavigationStats): NavigationStats {
		return Object.assign(new NavigationStats(), this, base);
	}

	public getPageName(): string {
		return this.selectedCategoryId;
	}
}
