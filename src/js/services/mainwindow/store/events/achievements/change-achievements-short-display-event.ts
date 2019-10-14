import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeAchievementsShortDisplayEvent implements MainWindowStoreEvent {
	constructor(shortDisplay: boolean) {
		this.shortDisplay = shortDisplay;
	}
	readonly shortDisplay: boolean;

	public static eventName(): string {
		return 'ChangeAchievementsShortDisplayEvent';
	}

	public eventName(): string {
		return 'ChangeAchievementsShortDisplayEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
