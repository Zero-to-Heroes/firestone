import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { StatGameFormatType } from '@firestone/stats/data-access';

export class ChangeDeckFormatFilterEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ChangeDeckFormatFilterEvent';
	}

	constructor(public readonly newFormat: StatGameFormatType) {}

	public eventName(): string {
		return 'ChangeDeckFormatFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
