import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class RestoreDeckSummaryEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'RestoreDeckSummaryEvent';
	}

	public eventName(): string {
		return 'RestoreDeckSummaryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
