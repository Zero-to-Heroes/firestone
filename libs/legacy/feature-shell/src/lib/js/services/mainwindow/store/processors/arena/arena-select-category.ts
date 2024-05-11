import { ArenaCategoryType, ArenaNavigationService } from '@firestone/arena/common';
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
	constructor(private readonly nav: ArenaNavigationService) {}

	public async process(
		event: ArenaSelectCategoryEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// Main issue is that using this breaks the back/next buttons
		this.nav.selectedCategoryId$$.next(event.value);
		return [null, null];
	}
}
