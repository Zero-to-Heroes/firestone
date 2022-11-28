import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../../../models/mainwindow/navigation/navigation-duels';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsSelectCategoryEvent } from '../../events/duels/duels-select-category-event';
import { Processor } from '../processor';

export class DuelsSelectCategoryProcessor implements Processor {
	public async process(
		event: DuelsSelectCategoryEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationDuels: navigationState.navigationDuels.update({
					selectedCategoryId: event.categoryId,
					expandedRunIds: [] as readonly string[],
					treasureSearchString: null,
					heroSearchString: null,
				} as NavigationDuels),
			} as NavigationState),
		];
	}
}
