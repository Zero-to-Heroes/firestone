import { MercenariesHeroLevelFilterType } from '../../../../../models/mercenaries/mercenaries-filter-types';
import { MainWindowStoreEvent } from '../main-window-store-event';

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
