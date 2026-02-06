import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MainWindowState, NavigationState, StatsCategoryType } from '@firestone/mainwindow/common';
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
