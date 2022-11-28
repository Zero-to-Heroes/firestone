import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedNewDeckVersionEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedNewDeckVersionEvent';
	}

	constructor(public readonly newVersionDeckstring: string, public readonly previousVersionDeckstring) {}

	public eventName(): string {
		return 'ConstructedNewDeckVersionEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
