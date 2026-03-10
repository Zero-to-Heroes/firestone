import { MainWindowStoreEvent } from '../main-window-store-event';
import { StatsXpGraphSeasonFilterType } from '../../../model/stats/stats-xp-graph-season-filter.type';

export class StatsXpGraphFilterSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = StatsXpGraphFilterSelectedEvent.eventName

	static readonly eventName = 'StatsXpGraphFilterSelectedEvent'

	constructor(public readonly value: StatsXpGraphSeasonFilterType) {}
}
