import { MercenariesHeroLevelFilterType } from '../../../../../models/mercenaries/mercenaries-hero-level-filter.type';
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
