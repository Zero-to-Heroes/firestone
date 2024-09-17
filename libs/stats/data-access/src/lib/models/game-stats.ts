import { BgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { GameStat } from './game-stat';

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
		});
		const newStats: readonly GameStat[] = this.stats.map((r) =>
			r.reviewId === newReplay.reviewId ? newReplay : r,
		);

		return this.update({
			stats: newStats,
		} as GameStats);
	}
}
