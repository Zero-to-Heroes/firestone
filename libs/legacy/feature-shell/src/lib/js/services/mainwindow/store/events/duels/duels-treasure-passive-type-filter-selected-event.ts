import { DuelsTreasureStatTypeFilterType } from '@firestone/duels/data-access';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTreasurePassiveTypeFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTreasurePassiveTypeFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsTreasureStatTypeFilterType) {}

	public eventName(): string {
		return 'DuelsTreasurePassiveTypeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
