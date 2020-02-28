import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeAchievementsActiveFilterEvent implements MainWindowStoreEvent {
	constructor(public readonly newFilter: string) {}

	public static eventName(): string {
		return 'ChangeAchievementsActiveFilterEvent';
	}

	public eventName(): string {
		return 'ChangeAchievementsActiveFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
