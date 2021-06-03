import { BgsPostMatchStats } from '../../battlegrounds/post-match/bgs-post-match-stats';
import { GameStat } from './game-stat';

export class GameStats {
	// Ordered from newest (index 0) to oldest
	readonly stats: readonly GameStat[] = [];

	public update(base: GameStats): GameStats {
		return Object.assign(new GameStats(), this, base);
	}

	public updateBgsPostMatchStats(reviewId: string, postMatchStats: BgsPostMatchStats): GameStats {
		const replay = this.stats.find((replay) => replay.reviewId === reviewId);
		// console.debug('[bgs-post-matchstats] found replay', replay, reviewId, postMatchStats);
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
		// console.debug('[bgs-post-matchstats] updated replays', newStats);
		return this.update({
			stats: newStats,
		} as GameStats);
	}
}
