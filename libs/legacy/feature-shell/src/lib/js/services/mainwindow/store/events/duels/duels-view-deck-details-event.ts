import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsViewDeckDetailsEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsViewDeckDetailsEvent';
	}

	constructor(public readonly deckId: number) {}

	public eventName(): string {
		return 'DuelsViewDeckDetailsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
