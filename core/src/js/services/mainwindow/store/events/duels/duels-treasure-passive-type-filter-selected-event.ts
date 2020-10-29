import { DuelsTreasurePassiveTypeFilterType } from '../../../../../models/duels/duels-treasure-passive-type-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTreasurePassiveTypeFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTreasurePassiveTypeFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsTreasurePassiveTypeFilterType) {}

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
