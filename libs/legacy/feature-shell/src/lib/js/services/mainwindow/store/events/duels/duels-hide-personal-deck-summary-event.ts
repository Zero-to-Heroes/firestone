import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsHidePersonalDeckSummaryEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'DuelsHidePersonalDeckSummaryEvent';
	}

	public eventName(): string {
		return 'DuelsHidePersonalDeckSummaryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
