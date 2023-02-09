import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BattlegroundsMetaHeroStatsLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'BattlegroundsMetaHeroStatsLoadedEvent';
	}

	constructor(public readonly stats: BgsHeroStatsV2) {}

	public eventName(): string {
		return 'BattlegroundsMetaHeroStatsLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
