import { MatchStatsCurrentStat } from './current-stat.type';
import { MatchStats } from './match-stats';

export class MatchStatsState {
	readonly visible: boolean;
	readonly matchStats: MatchStats;
	readonly currentStat: MatchStatsCurrentStat;
}
