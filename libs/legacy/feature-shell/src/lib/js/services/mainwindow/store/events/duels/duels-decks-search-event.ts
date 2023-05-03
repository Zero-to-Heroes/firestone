import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsDecksSearchEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsDecksSearchEvent';
	}

	constructor(public readonly value: string) {}

	public eventName(): string {
		return 'DuelsDecksSearchEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
