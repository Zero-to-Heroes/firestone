import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesHeroSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly heroId: string) {}

	public static eventName(): string {
		return 'MercenariesHeroSelectedEvent';
	}

	public eventName(): string {
		return 'MercenariesHeroSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
