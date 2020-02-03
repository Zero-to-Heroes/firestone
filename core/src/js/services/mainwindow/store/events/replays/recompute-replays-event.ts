import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class RecomputeReplaysEvent implements MainWindowStoreEvent {
	constructor(readonly gameStats: GameStats) {}

	public static eventName(): string {
		return 'RecomputeReplaysEvent';
	}

	public eventName(): string {
		return 'RecomputeReplaysEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return true;
	}
}
