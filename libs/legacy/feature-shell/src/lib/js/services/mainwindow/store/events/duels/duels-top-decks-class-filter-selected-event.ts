import { DuelsHeroFilterType } from '@firestone/duels/data-access';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTopDecksHeroFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTopDecksHeroFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsHeroFilterType) {}

	public eventName(): string {
		return 'DuelsTopDecksHeroFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
