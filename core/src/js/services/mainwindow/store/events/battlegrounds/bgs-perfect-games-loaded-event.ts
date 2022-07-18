import { GameStat } from '../../../../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BattlegroundsPerfectGamesLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'BattlegroundsPerfectGamesLoadedEvent';
	}

	constructor(public readonly games: readonly GameStat[]) {}

	public eventName(): string {
		return 'BattlegroundsPerfectGamesLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
