import { BgsPostMatchStatsPanel } from '@firestone/game-state';
import { GameStat } from '@firestone/stats/data-access';

export class MatchDetail {
	readonly replayInfo: GameStat;
	readonly bgsPostMatchStatsPanel?: BgsPostMatchStatsPanel;
}
