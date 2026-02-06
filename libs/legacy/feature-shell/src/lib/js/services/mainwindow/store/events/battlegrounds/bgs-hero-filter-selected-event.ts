import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
