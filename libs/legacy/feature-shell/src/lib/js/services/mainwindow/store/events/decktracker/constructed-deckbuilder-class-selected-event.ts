import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderClassSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedDeckbuilderClassSelectedEvent';
	}

	constructor(public readonly playerClass: string) {}

	public eventName(): string {
		return 'ConstructedDeckbuilderClassSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
