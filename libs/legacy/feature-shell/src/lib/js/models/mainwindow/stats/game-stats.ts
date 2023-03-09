import { GameStat } from '@firestone/stats/data-access';
import { NonFunctionProperties } from '../../../services/utils';
import { BgsPostMatchStats } from '../../battlegrounds/post-match/bgs-post-match-stats';

export class GameStats {
	// Ordered from newest (index 0) to oldest
	readonly stats: readonly GameStat[] = [];

	public static create(base: Partial<NonFunctionProperties<GameStats>>): GameStats {
		return Object.assign(new GameStats(), base);
	}

	public update(base: Partial<NonFunctionProperties<GameStats>>): GameStats {
		return Object.assign(new GameStats(), this, base);
	}

	public updateBgsPostMatchStats(reviewId: string, postMatchStats: BgsPostMatchStats): GameStats {
		const replay = this.stats.find((replay) => replay.reviewId === reviewId);

		if (!replay) {
			console.warn('[bgs-post-matchstats] counld not find replay', reviewId);
			return this;
		}

		const newReplay = replay.update({
			...replay,
			postMatchStats: postMatchStats,
		} as GameStat);
		const newStats: readonly GameStat[] = this.stats.map((r) =>
			r.reviewId === newReplay.reviewId ? newReplay : r,
		);

		return this.update({
			stats: newStats,
		} as GameStats);
	}
}
