import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationBattlegrounds } from '../../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '../../events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { Processor } from '../processor';

export class BgsPersonalStatsSelectHeroDetailsProcessor implements Processor {
	public async process(
		event: BgsPersonalStatsSelectHeroDetailsEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const category = BattlegroundsAppState.findCategory(
			currentState.battlegrounds,
			'bgs-category-personal-hero-details-' + event.heroCardId,
		);
		// console.log('found category', category);
		const globalCategory = currentState.battlegrounds.globalCategories.find(globalCategory =>
			globalCategory.hasSubCategory(category.id),
		);
		const navigationBattlegrounds = navigationState.navigationBattlegrounds.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: globalCategory.id,
			selectedCategoryId: category.id,
		} as NavigationBattlegrounds);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationBattlegrounds: navigationBattlegrounds,
				text:
					globalCategory.name !== category.name ? globalCategory.name + ' - ' + category.name : category.name,
				image: null,
			} as NavigationState),
		];
	}
}
