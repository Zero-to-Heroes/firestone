import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesHeroLevelFilterType } from '@firestone/mercenaries/common';

export class MercenariesHeroLevelFilterSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesHeroLevelFilterSelectedEvent.eventName

	constructor(public readonly level: MercenariesHeroLevelFilterType) {}

	static readonly eventName = 'MercenariesHeroLevelFilterSelectedEvent'
}
