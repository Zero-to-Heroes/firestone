import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsChoosingHeroEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsChoosingHeroEvent';
	}

	constructor(public readonly value: boolean) {}

	public eventName(): string {
		return 'DuelsChoosingHeroEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
