import { BgsHeroStatsFilterId } from '../../../../../models/mainwindow/battlegrounds/categories/bgs-hero-stats-filter-id';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectBattlegroundsPersonalStatsHeroTabEvent implements MainWindowStoreEvent {
	constructor(public readonly tab: BgsHeroStatsFilterId) {}

	public static eventName(): string {
		return 'SelectBattlegroundsPersonalStatsHeroTabEvent';
	}

	public eventName(): string {
		return 'SelectBattlegroundsPersonalStatsHeroTabEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
