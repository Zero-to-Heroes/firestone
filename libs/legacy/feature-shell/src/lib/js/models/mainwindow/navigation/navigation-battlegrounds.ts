import { NonFunctionProperties } from '../../../services/utils';
import { CurrentView } from '../achievement/current-view.type';
import { BgsHeroStatsFilterId } from '../battlegrounds/categories/bgs-hero-stats-filter-id';

export class NavigationBattlegrounds {
	readonly currentView: CurrentView = 'list';
	readonly menuDisplayType: string = 'menu';
	readonly selectedPersonalHeroStatsTab: BgsHeroStatsFilterId = 'winrate-stats';

	public update(base: Partial<NonFunctionProperties<NavigationBattlegrounds>>): NavigationBattlegrounds {
		return Object.assign(new NavigationBattlegrounds(), this, base);
	}

	public getPageName(): string {
		return this.currentView;
	}
}
