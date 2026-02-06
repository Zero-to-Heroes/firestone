import { BgsHeroSortFilterType } from '@firestone/battlegrounds/view';
import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
