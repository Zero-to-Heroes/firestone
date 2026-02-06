import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { DeckTimeFilterType } from '@firestone/mainwindow/common';

export class ChangeDeckTimeFilterEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ChangeDeckTimeFilterEvent';
	}

	constructor(public readonly newFormat: DeckTimeFilterType) {}

	public eventName(): string {
		return 'ChangeDeckTimeFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
