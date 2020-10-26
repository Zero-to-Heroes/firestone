export class NavigationDuels {
	readonly selectedCategoryId: 'duels-runs';
	readonly menuDisplayType: string = 'menu';

	public update(base: NavigationDuels): NavigationDuels {
		return Object.assign(new NavigationDuels(), this, base);
	}
}
