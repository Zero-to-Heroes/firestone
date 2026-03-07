import { MainWindowStoreEvent } from '../main-window-store-event';

export class HideDeckSummaryEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'HideDeckSummaryEvent';
	}

	public eventName(): string {
		return 'HideDeckSummaryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
