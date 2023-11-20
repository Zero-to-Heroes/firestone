import { ArenaCategoryType } from '@legacy-import/src/lib/js/models/mainwindow/arena/arena-category.type';
import { MainWindowState } from '@legacy-import/src/lib/js/models/mainwindow/main-window-state';
import { NavigationState } from '@legacy-import/src/lib/js/models/mainwindow/navigation/navigation-state';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';
import { Processor } from '../processor';

export class ArenaSelectCategoryEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ArenaSelectCategoryEvent';
	}

	constructor(public readonly value: ArenaCategoryType) {}

	public eventName(): string {
		return 'ArenaSelectCategoryEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}

export class ArenaSelectCategoryProcessor implements Processor {
	public async process(
		event: ArenaSelectCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationArena: navigationState.navigationArena.update({
					selectedCategoryId: event.value,
				}),
			}),
		];
	}
}
