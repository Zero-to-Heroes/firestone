import { DuelsCategoryType } from '../duels/duels-category.type';

export class NavigationDuels {
	readonly selectedCategoryId: DuelsCategoryType = 'duels-runs';
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';
	readonly selectedDeckId: number;
	readonly selectedPersonalDeckstring: string;
	// Used when navigating to the deck details
	readonly expandedRunIds: readonly string[];
	readonly treasureSearchString: string;
	readonly heroSearchString: string;

	public update(base: NavigationDuels): NavigationDuels {
		return Object.assign(new NavigationDuels(), this, base);
	}

	public getPageName(): string {
		return this.selectedCategoryId;
	}
}
