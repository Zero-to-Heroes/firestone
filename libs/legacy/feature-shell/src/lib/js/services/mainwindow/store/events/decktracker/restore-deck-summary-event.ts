import { MainWindowStoreEvent } from '../main-window-store-event';

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
