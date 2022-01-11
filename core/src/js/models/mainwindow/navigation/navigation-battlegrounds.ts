import { NonFunctionProperties } from '../../../services/utils';
import { CurrentView } from '../achievement/current-view.type';
import { BgsHeroStatsFilterId } from '../battlegrounds/categories/bgs-hero-stats-filter-id';

export class NavigationBattlegrounds {
	readonly currentView: CurrentView = 'category';
	readonly menuDisplayType: string = 'menu';
	readonly selectedCategoryId:
		| 'bgs-category-personal-heroes'
		| 'bgs-category-personal-hero-details'
		| 'bgs-category-personal-rating'
		| 'bgs-category-personal-stats'
		| 'bgs-category-perfect-games'
		| 'bgs-category-simulator';
	// | 'bgs-category-personal-ai';
	readonly selectedPersonalHeroStatsTab: BgsHeroStatsFilterId = 'winrate-stats';

	public update(base: Partial<NonFunctionProperties<NavigationBattlegrounds>>): NavigationBattlegrounds {
		return Object.assign(new NavigationBattlegrounds(), this, base);
	}

	public getPageName(): string {
		return this.currentView;
	}
}
