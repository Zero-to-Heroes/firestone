import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { StatsCategoryType } from '../../../../../models/mainwindow/stats/stats-category';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';
import { Processor } from '../processor';

export class ProfileSelectCategoryEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ProfileSelectCategoryEvent';
	}

	constructor(public readonly categoryId: StatsCategoryType) {}

	public eventName(): string {
		return 'ProfileSelectCategoryEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}

export class ProfileSelectCategoryProcessor implements Processor {
	public async process(
		event: ProfileSelectCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationStats: navigationState.navigationStats.update({
					selectedCategoryId: event.categoryId,
				}),
			}),
		];
	}
}
