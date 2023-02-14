import { BgsHeroStrategies } from '../../../../battlegrounds/bgs-meta-hero-strategies.service';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BattlegroundsMetaHeroStrategiesLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'BattlegroundsMetaHeroStrategiesLoadedEvent';
	}

	constructor(public readonly stats: BgsHeroStrategies) {}

	public eventName(): string {
		return 'BattlegroundsMetaHeroStrategiesLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
