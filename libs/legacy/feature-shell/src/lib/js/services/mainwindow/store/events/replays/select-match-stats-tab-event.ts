import { BgsStatsFilterId } from '@firestone/game-state';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectMatchStatsTabEvent implements MainWindowStoreEvent {
	constructor(public readonly tab: BgsStatsFilterId, public readonly tabIndex: number) {}

	public static eventName(): string {
		return 'SelectMatchStatsTabEvent';
	}

	public eventName(): string {
		return 'SelectMatchStatsTabEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
