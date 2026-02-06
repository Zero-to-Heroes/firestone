import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
