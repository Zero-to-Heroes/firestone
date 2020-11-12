import { DuelsGameModeFilterType } from '../../../../../models/duels/duels-game-mode-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsGameModeFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsGameModeFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsGameModeFilterType) {}

	public eventName(): string {
		return 'DuelsGameModeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
