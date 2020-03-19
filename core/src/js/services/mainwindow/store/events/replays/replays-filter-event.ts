import { ReplaysFilterCategoryType } from '../../../../../models/mainwindow/replays/replays-filter-category.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ReplaysFilterEvent implements MainWindowStoreEvent {
	constructor(public readonly type: ReplaysFilterCategoryType, public readonly selectedValue: string) {}

	public static eventName(): string {
		return 'ReplaysFilterEvent';
	}

	public eventName(): string {
		return 'ReplaysFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
