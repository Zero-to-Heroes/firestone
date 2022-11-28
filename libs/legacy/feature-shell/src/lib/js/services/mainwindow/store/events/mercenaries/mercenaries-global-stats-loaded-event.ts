import { MercenariesGlobalStats } from '../../../../mercenaries/mercenaries-state-builder.service';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesGlobalStatsLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MercenariesGlobalStatsLoadedEvent';
	}

	constructor(public readonly stats: MercenariesGlobalStats) {}

	public eventName(): string {
		return 'MercenariesGlobalStatsLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
