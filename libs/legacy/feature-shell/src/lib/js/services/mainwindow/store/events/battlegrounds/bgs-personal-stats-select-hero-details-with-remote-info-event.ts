import { BgsPostMatchStatsForReview } from '@firestone/game-state';
import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent implements MainWindowStoreEvent {
	constructor(
		public readonly lastHeroPostMatchStats: readonly BgsPostMatchStatsForReview[],
		public readonly heroId: string,
	) {}

	public static eventName(): string {
		return 'BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent';
	}

	public eventName(): string {
		return 'BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
