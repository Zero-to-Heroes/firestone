import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class GameStatsInitEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'GameStatsInitEvent';
	}

	constructor(public readonly newGameStats: GameStats) {}

	public eventName(): string {
		return 'GameStatsInitEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
