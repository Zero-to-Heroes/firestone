import { DuelsCategoryType } from '../duels/duels-category.type';

export class NavigationDuels {
	readonly selectedCategoryId: DuelsCategoryType = 'duels-runs';
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';
	readonly selectedDeckId: number;
	readonly selectedPersonalDeckstring: string;

	public update(base: NavigationDuels): NavigationDuels {
		return Object.assign(new NavigationDuels(), this, base);
	}
}
