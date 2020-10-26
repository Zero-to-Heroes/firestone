import { DuelsCategoryType } from '../duels/duels-category.type';

export class NavigationDuels {
	readonly selectedCategoryId: DuelsCategoryType = 'duels-runs';
	readonly menuDisplayType: string = 'menu';

	public update(base: NavigationDuels): NavigationDuels {
		return Object.assign(new NavigationDuels(), this, base);
	}
}
