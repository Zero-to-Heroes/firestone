import { MainWindowStoreEvent } from '../main-window-store-event';

export class DecktrackerDeleteDeckEvent implements MainWindowStoreEvent {
	constructor(public readonly deckstring: string) {}

	public static eventName(): string {
		return 'DecktrackerDeleteDeckEvent';
	}

	public eventName(): string {
		return 'DecktrackerDeleteDeckEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
