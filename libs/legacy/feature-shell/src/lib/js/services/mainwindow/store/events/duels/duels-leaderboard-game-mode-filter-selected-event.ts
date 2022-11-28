import { DuelsGameModeFilterType } from '../../../../../models/duels/duels-game-mode-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsLeaderboardGameModeFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsLeaderboardGameModeFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsGameModeFilterType) {}

	public eventName(): string {
		return 'DuelsLeaderboardGameModeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
