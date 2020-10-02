import { BgsPostMatchStats } from '../../../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowMatchStatsEvent implements MainWindowStoreEvent {
	constructor(public readonly reviewId: string, public readonly stats: BgsPostMatchStats) {}

	public static eventName(): string {
		return 'ShowMatchStatsEvent';
	}

	public eventName(): string {
		return 'ShowMatchStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
