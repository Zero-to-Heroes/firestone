import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MercenariesHeroLevelFilterType } from '../../../../../models/mercenaries/mercenaries-filter-types';

export class MercenariesHeroLevelFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly level: MercenariesHeroLevelFilterType) {}

	public static eventName(): string {
		return 'MercenariesHeroLevelFilterSelectedEvent';
	}

	public eventName(): string {
		return 'MercenariesHeroLevelFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
