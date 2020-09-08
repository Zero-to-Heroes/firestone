import { MainWindowStoreEvent } from '../main-window-store-event';

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
