import {
	MainWindowState,
	MercenariesSelectCategoryEvent,
	NavigationMercenaries,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class MercenariesSelectCategoryProcessor implements Processor {
	public async process(
		event: MercenariesSelectCategoryEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const nav = navigationState.update({
			navigationMercenaries: navigationState.navigationMercenaries.update({
				selectedCategoryId: event.categoryId,
				selectedHeroId: undefined,
				menuDisplayType: 'menu',
			}),
		} as NavigationState);
		return [null, nav];
	}
}
