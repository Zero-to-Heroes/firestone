import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationBattlegrounds } from '../../../../../models/mainwindow/navigation/navigation-battlegrounds';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectBattlegroundsCategoryEvent } from '../../events/battlegrounds/select-battlegrounds-category-event';
import { Processor } from '../processor';

export class SelectBattlegroundsCategoryProcessor implements Processor {
	public async process(
		event: SelectBattlegroundsCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const navigationBattlegrounds = navigationState.navigationBattlegrounds.update({
			currentView: 'list',
			menuDisplayType: 'menu',
			selectedCategoryId: event.categoryId,
		} as NavigationBattlegrounds);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationBattlegrounds: navigationBattlegrounds,
				text: null,
				image: null,
			} as NavigationState),
		];
	}
}
