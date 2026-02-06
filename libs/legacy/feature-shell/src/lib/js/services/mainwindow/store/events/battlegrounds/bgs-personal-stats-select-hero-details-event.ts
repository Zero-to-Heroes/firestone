import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class BgsPersonalStatsSelectHeroDetailsEvent implements MainWindowStoreEvent {
	constructor(public readonly heroCardId: string) {}

	public static eventName(): string {
		return 'BgsPersonalStatsSelectHeroDetailsEvent';
	}

	public eventName(): string {
		return 'BgsPersonalStatsSelectHeroDetailsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
