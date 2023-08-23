import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowMatchStatsEvent implements MainWindowStoreEvent {
	constructor(public readonly reviewId: string, public readonly stats: IBgsPostMatchStats) {}

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
