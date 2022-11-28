import { DuelsDeckStat } from '../../../../../models/duels/duels-player-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTopDeckRunDetailsLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTopDeckRunDetailsLoadedEvent';
	}

	// For now only the steps are populated
	constructor(public readonly deck: DuelsDeckStat) {}

	public eventName(): string {
		return 'DuelsTopDeckRunDetailsLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
