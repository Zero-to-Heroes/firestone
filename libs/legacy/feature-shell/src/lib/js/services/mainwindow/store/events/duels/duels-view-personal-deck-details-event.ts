import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsViewPersonalDeckDetailsEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsViewPersonalDeckDetailsEvent';
	}

	constructor(public readonly deckstring: string) {}

	public eventName(): string {
		return 'DuelsViewPersonalDeckDetailsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
