import { GameStat } from '../mainwindow/stats/game-stat';

export interface RunStep extends GameStat {
	readonly treasureCardId: string;
	readonly lootCardIds: readonly string[];
}
