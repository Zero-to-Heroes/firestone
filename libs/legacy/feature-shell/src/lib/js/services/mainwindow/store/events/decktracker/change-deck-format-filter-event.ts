import { StatGameFormatType } from '../../../../../models/mainwindow/stats/stat-game-format.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

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
