import { BgsGlobalHeroStat2 } from '@firestone-hs/bgs-global-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsQuestsDataLoadedEvent implements MainWindowStoreEvent {
	constructor(public readonly data: readonly BgsGlobalHeroStat2[]) {}

	public static eventName(): string {
		return 'BgsQuestsDataLoadedEvent';
	}

	public eventName(): string {
		return 'BgsQuestsDataLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
