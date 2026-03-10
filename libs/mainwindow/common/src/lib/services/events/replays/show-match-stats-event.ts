import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowMatchStatsEvent implements MainWindowStoreEvent {
	
	readonly eventName = ShowMatchStatsEvent.eventName

	constructor(
		public readonly reviewId: string,
		public readonly stats: IBgsPostMatchStats,
	) {}

	static readonly eventName = 'ShowMatchStatsEvent'
}
