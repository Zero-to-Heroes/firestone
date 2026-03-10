import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesPersonalHeroesSortCriteriaType } from '@firestone/mercenaries/common';

export class MercenariesPersonalHeroesSortEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesPersonalHeroesSortEvent.eventName

	static readonly eventName = 'MercenariesPersonalHeroesSortEvent'

	constructor(public readonly criteria: MercenariesPersonalHeroesSortCriteriaType) {}
}
