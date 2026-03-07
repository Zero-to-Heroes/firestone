import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectDeckDetailsEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'SelectDeckDetailsEvent';
	}

	public eventName(): string {
		return 'SelectDeckDetailsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
