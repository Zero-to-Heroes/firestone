import { BgsPostMatchStatsForReview } from '../../battlegrounds/bgs-post-match-stats-for-review';
import { BgsStats } from '../../battlegrounds/stats/bgs-stats';
import { GameStat } from '../stats/game-stat';
import { BattlegroundsCategory } from './battlegrounds-category';
import { BgsActiveTimeFilterType } from './bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from './bgs-hero-sort-filter.type';
import { BgsRankFilterType } from './bgs-rank-filter.type';
import { MmrGroupFilterType } from './mmr-group-filter-type';

export class BattlegroundsAppState {
	readonly categories: readonly BattlegroundsCategory[];
	readonly loading: boolean = true;
	// The global stats coming from the DB (so without the player info)
	readonly globalStats: BgsStats;
	readonly matchStats: readonly GameStat[];
	readonly perfectGames: readonly GameStat[];
	// The stats used by the app (so a mix a globalStats + matchStats + filters)
	readonly stats: BgsStats;
	readonly lastHeroPostMatchStats: readonly BgsPostMatchStatsForReview[];

	readonly activeTimeFilter: BgsActiveTimeFilterType;
	readonly activeHeroSortFilter: BgsHeroSortFilterType;
	readonly activeRankFilter: BgsRankFilterType;
	readonly activeGroupMmrFilter: MmrGroupFilterType;

	public static create(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), base);
	}

	public update(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), this, base);
	}

	public static findCategory(state: BattlegroundsAppState, categoryId: string) {
		return state.categories?.find((cat) => cat.id === categoryId);
	}

	public findReplay(reviewId: string): GameStat {
		return [...(this.perfectGames ?? []), ...(this.matchStats ?? [])].find(
			(replay) => replay.reviewId === reviewId,
		);
	}
}
