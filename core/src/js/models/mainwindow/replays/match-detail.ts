import { BgsPostMatchStatsPanel } from '../../battlegrounds/post-match/bgs-post-match-stats-panel';
import { GameStat } from '../stats/game-stat';

export class MatchDetail {
	readonly replayInfo: GameStat;
	readonly bgsPostMatchStatsPanel?: BgsPostMatchStatsPanel;
}
