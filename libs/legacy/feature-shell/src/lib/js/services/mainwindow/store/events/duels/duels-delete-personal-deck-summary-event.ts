import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsDeletePersonalDeckSummaryEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'DuelsDeletePersonalDeckSummaryEvent';
	}

	public eventName(): string {
		return 'DuelsDeletePersonalDeckSummaryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
