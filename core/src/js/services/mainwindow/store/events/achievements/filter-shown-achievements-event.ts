import { MainWindowStoreEvent } from '../main-window-store-event';

export class FilterShownAchievementsEvent implements MainWindowStoreEvent {
	constructor(public readonly searchString: string) {}

	public static eventName(): string {
		return 'FilterShownAchievementsEvent';
	}

	public eventName(): string {
		return 'FilterShownAchievementsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
