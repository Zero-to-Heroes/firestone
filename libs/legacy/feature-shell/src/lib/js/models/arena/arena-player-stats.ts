import { DeckStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { GameStat } from '../mainwindow/stats/game-stat';

export interface ArenaDeckStat extends DeckStat {
	readonly heroCardId: string;
	readonly steps: readonly (GameStat | DuelsRunInfo)[];
}
