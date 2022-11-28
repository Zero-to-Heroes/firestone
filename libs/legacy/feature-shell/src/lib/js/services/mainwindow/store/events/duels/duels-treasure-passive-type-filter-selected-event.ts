import { DuelsTreasureStatTypeFilterType } from '../../../../../models/duels/duels-treasure-stat-type-filter.type';
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
