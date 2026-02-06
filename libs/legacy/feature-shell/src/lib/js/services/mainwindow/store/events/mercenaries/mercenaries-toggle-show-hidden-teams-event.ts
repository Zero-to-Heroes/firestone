import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class MercenariesToggleShowHiddenTeamsEvent implements MainWindowStoreEvent {
	constructor(public readonly newValue: boolean) {}

	public static eventName(): string {
		return 'MercenariesToggleShowHiddenTeamsEvent';
	}

	public eventName(): string {
		return 'MercenariesToggleShowHiddenTeamsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
