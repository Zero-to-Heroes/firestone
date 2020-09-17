import { CurrentView } from '../achievement/current-view.type';

export class NavigationBattlegrounds {
	readonly currentView: CurrentView = 'category';
	readonly menuDisplayType: string = 'menu';
	readonly selectedGlobalCategoryId: 'bgs-global-category-personal-stats' | 'bgs-global-category-meta-stats';
	readonly selectedCategoryId:
		| 'bgs-category-personal-heroes'
		| 'bgs-category-personal-hero-details'
		| 'bgs-category-personal-rating'
		| 'bgs-category-personal-stats'
		| 'bgs-category-personal-ai';

	public update(base: NavigationBattlegrounds): NavigationBattlegrounds {
		return Object.assign(new NavigationBattlegrounds(), this, base);
	}
}
