import { GameStat } from '@firestone/stats/data-access';
import { BgsPostMatchStatsPanel } from '../../battlegrounds/post-match/bgs-post-match-stats-panel';

export class MatchDetail {
	readonly replayInfo: GameStat;
	readonly bgsPostMatchStatsPanel?: BgsPostMatchStatsPanel;
}
