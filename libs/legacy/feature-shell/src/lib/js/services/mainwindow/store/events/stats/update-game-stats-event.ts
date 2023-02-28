import { GameStat } from '../../../../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class UpdateGameStatsEvent implements MainWindowStoreEvent {
	constructor(public readonly stats: readonly GameStat[]) {}

	public static eventName(): string {
		return 'UpdateGameStatsEvent';
	}

	public eventName(): string {
		return 'UpdateGameStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
