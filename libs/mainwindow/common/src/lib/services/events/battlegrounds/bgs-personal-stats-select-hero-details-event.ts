import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsPersonalStatsSelectHeroDetailsEvent implements MainWindowStoreEvent {
	
	readonly eventName = BgsPersonalStatsSelectHeroDetailsEvent.eventName

	constructor(public readonly heroCardId: string) {}

	static readonly eventName = 'BgsPersonalStatsSelectHeroDetailsEvent'
}
