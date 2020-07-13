import { BgsBestStat } from '../../battlegrounds/post-match/bgs-best-stat';
import { GameStats } from './game-stats';

export class StatsState {
	readonly gameStats: GameStats = new GameStats();
	readonly bestBgsUserStats: readonly BgsBestStat[];

	public update(base: StatsState): StatsState {
		return Object.assign(new StatsState(), this, base);
	}
}
