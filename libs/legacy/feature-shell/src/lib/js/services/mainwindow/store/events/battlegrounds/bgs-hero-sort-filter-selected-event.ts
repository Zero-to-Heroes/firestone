import { BgsHeroSortFilterType } from '../../../../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsHeroSortFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly heroSortFilter: BgsHeroSortFilterType) {}

	public static eventName(): string {
		return 'BgsHeroSortFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsHeroSortFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
