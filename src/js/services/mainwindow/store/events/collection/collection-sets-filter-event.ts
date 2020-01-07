import { StatGameFormatType } from '../../../../../models/mainwindow/stats/stat-game-format.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class CollectionSetsFilterEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'CollectionSetsFilterEvent';
	}

	constructor(public readonly value: StatGameFormatType) {}

	public eventName(): string {
		return 'CollectionSetsFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
