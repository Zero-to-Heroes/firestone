import { BgsPostMatchStatsForReview } from '@firestone/game-state';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent implements MainWindowStoreEvent {
	
	readonly eventName = BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent.eventName

	constructor(
		public readonly lastHeroPostMatchStats: readonly BgsPostMatchStatsForReview[],
		public readonly heroId: string,
	) {}

	static readonly eventName = 'BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent'
}
