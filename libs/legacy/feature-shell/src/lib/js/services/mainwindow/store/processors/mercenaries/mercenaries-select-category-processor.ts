import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationMercenaries } from '../../../../../models/mainwindow/navigation/navigation-mercenaries';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MercenariesSelectCategoryEvent } from '../../events/mercenaries/mercenaries-select-category-event';
import { Processor } from '../processor';

export class MercenariesSelectCategoryProcessor implements Processor {
	public async process(
		event: MercenariesSelectCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const nav = navigationState.update({
			navigationMercenaries: navigationState.navigationMercenaries.update({
				selectedCategoryId: event.categoryId,
				selectedHeroId: null,
				menuDisplayType: 'menu',
			} as NavigationMercenaries),
		} as NavigationState);
		return [null, nav];
	}
}
