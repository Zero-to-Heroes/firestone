import { CurrentView } from '../achievement/current-view.type';

export class NavigationBattlegrounds {
	readonly currentView: CurrentView = 'categories';
	readonly menuDisplayType: string = 'menu';
	readonly selectedGlobalCategoryId: string;
	readonly selectedCategoryId: string;

	public update(base: NavigationBattlegrounds): NavigationBattlegrounds {
		return Object.assign(new NavigationBattlegrounds(), this, base);
	}
}
