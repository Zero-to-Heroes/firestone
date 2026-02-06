import { MainWindowState, NavigationMercenaries, NavigationState } from '@firestone/mainwindow/common';
import { MercenariesSelectCategoryEvent } from '../../events/mercenaries/mercenaries-select-category-event';
import { Processor } from '../processor';

export class MercenariesSelectCategoryProcessor implements Processor {
	public async process(
		event: MercenariesSelectCategoryEvent,
		currentState: MainWindowState,
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
