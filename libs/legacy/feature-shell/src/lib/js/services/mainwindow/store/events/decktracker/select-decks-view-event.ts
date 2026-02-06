import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { DecktrackerViewType } from '@firestone/mainwindow/common';

export class SelectDecksViewEvent implements MainWindowStoreEvent {
	constructor(public readonly newView: DecktrackerViewType) {}

	public static eventName(): string {
		return 'SelectDecksViewEvent';
	}

	public eventName(): string {
		return 'SelectDecksViewEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
