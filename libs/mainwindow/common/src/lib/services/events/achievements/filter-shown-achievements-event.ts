import { MainWindowStoreEvent } from '../main-window-store-event';

export class FilterShownAchievementsEvent implements MainWindowStoreEvent {
	
	readonly eventName = FilterShownAchievementsEvent.eventName

	constructor(public readonly searchString: string) {}

	static readonly eventName = 'FilterShownAchievementsEvent'
}
