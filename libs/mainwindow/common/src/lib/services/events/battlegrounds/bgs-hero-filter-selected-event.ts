import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsHeroFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly heroFilter: string) {}

	public static eventName(): string {
		return 'BgsHeroFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsHeroFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
