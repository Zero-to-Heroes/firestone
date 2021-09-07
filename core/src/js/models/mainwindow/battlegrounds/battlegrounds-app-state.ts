import { BgsPostMatchStatsForReview } from '../../battlegrounds/bgs-post-match-stats-for-review';
import { BgsStats } from '../../battlegrounds/stats/bgs-stats';
import { GameStat } from '../stats/game-stat';
import { BattlegroundsCategory } from './battlegrounds-category';
import { BgsCustomSimulationState } from './simulator/bgs-custom-simulation-state';

export class BattlegroundsAppState {
	readonly categories: readonly BattlegroundsCategory[] = [];
	readonly loading: boolean = true;
	// The global stats coming from the DB (so without the player info)
	readonly globalStats: BgsStats = new BgsStats();
	readonly perfectGames: readonly GameStat[];
	// The stats used by the app (so a mix a globalStats + matchStats + filters)
	readonly stats: BgsStats = new BgsStats();
	readonly lastHeroPostMatchStats: readonly BgsPostMatchStatsForReview[];
	readonly lastHeroPostMatchStatsHeroId: string;
	readonly customSimulationState: BgsCustomSimulationState = new BgsCustomSimulationState();

	public static create(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), base);
	}

	public update(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), this, base);
	}

	public findCategory(categoryId: string) {
		const result = this.categories?.find((cat) => cat.id === categoryId);
		if (result) {
			return result;
		}
		return this.categories
			?.map((cat) => cat.categories)
			?.reduce((a, b) => a.concat(b), [])
			?.find((cat) => cat.findCategory(categoryId));
	}

	public findReplay(reviewId: string): GameStat {
		return [...(this.perfectGames ?? [])].find((replay) => replay.reviewId === reviewId);
	}
}
