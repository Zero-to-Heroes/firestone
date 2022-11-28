import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsToggleShowHiddenPersonalDecksEvent implements MainWindowStoreEvent {
	constructor(public readonly newValue: boolean) {}

	public static eventName(): string {
		return 'DuelsToggleShowHiddenPersonalDecksEvent';
	}

	public eventName(): string {
		return 'DuelsToggleShowHiddenPersonalDecksEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
