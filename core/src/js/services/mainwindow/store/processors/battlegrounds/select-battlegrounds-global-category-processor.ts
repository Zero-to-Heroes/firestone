import { BattlegroundsGlobalCategory } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-global-category';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationBattlegrounds } from '../../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectBattlegroundsGlobalCategoryEvent } from '../../events/battlegrounds/select-battlegrounds-global-category-event';
import { Processor } from '../processor';

export class SelectBattlegroundsGlobalCategoryProcessor implements Processor {
	public async process(
		event: SelectBattlegroundsGlobalCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const globalCategory: BattlegroundsGlobalCategory = currentState.battlegrounds.globalCategories.find(
			(cat) => cat.id === event.globalCategoryId,
		);
		const navigationBattlegrounds = navigationState.navigationBattlegrounds.update({
			currentView: 'category',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: event.globalCategoryId,
			selectedCategoryId: undefined,
		} as NavigationBattlegrounds);
		// console.log('selecting global category', navigationState, navigationBattlegrounds);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationBattlegrounds: navigationBattlegrounds,
				text: globalCategory.name,
				image: null,
			} as NavigationState),
		];
	}
}
