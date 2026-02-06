import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
