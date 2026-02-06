import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class ToggleShowHiddenDecksEvent implements MainWindowStoreEvent {
	constructor(public readonly newValue: boolean) {}

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
