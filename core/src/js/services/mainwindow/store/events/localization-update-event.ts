import { MainWindowStoreEvent } from './main-window-store-event';

export class LocalizationUpdateEvent implements MainWindowStoreEvent {
	constructor(public readonly locale: string) {}

	public static eventName(): string {
		return 'LocalizationUpdateEvent';
	}

	public eventName(): string {
		return 'LocalizationUpdateEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
