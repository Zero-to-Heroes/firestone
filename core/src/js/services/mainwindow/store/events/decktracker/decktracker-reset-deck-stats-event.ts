import { MainWindowStoreEvent } from '../main-window-store-event';

export class DecktrackerResetDeckStatsEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'DecktrackerResetDeckStatsEvent';
	}

	public eventName(): string {
		return 'DecktrackerResetDeckStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
