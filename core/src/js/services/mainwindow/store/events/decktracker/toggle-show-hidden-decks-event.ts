import { MainWindowStoreEvent } from '../main-window-store-event';

export class ToggleShowHiddenDecksEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ToggleShowHiddenDecksEvent';
	}

	public eventName(): string {
		return 'ToggleShowHiddenDecksEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
