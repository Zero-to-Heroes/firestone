import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsRestorePersonalDeckSummaryEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'DuelsRestorePersonalDeckSummaryEvent';
	}

	public eventName(): string {
		return 'DuelsRestorePersonalDeckSummaryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
