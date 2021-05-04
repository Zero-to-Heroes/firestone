import { BgsPostMatchStatsForReview } from '../../battlegrounds/bgs-post-match-stats-for-review';
import { BgsStats } from '../../battlegrounds/stats/bgs-stats';
import { GameStat } from '../stats/game-stat';
import { BattlegroundsCategory } from './battlegrounds-category';
import { BattlegroundsGlobalCategory } from './battlegrounds-global-category';
import { BgsActiveTimeFilterType } from './bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from './bgs-hero-sort-filter.type';
import { BgsRankFilterType } from './bgs-rank-filter.type';
import { MmrGroupFilterType } from './mmr-group-filter-type';

export class BattlegroundsAppState {
	readonly globalCategories: readonly BattlegroundsGlobalCategory[] = [];
	readonly loading: boolean = true;
	// The global stats coming from the DB (so without the player info)
	readonly globalStats: BgsStats;
	readonly matchStats: readonly GameStat[];
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
		const allCategories = state.globalCategories
			.filter((globalCategory) => globalCategory.categories)
			.map((globalCategory) => globalCategory.categories)
			.reduce((a, b) => a.concat(b), [])
			.map((category) => BattlegroundsAppState.extractCategory(category))
			.reduce((a, b) => a.concat(b), []);
		return allCategories.find((cat) => cat.id === categoryId);
	}

	public static findParentCategory(state: BattlegroundsAppState, categoryId: string) {
		return BattlegroundsAppState.findParentCategoryInternal(state.globalCategories, categoryId);
	}

	public static findParentCategoryInternal(
		categories: readonly (BattlegroundsCategory | BattlegroundsGlobalCategory)[],
		categoryId: string,
	): BattlegroundsCategory | BattlegroundsGlobalCategory {
		if (!categories) {
			return null;
		}
		for (const cat of categories) {
			if (cat.id === categoryId) {
				return null;
			}
			if (cat.categories.some((subCat) => subCat.id === categoryId)) {
				return cat;
			}
			const sub = BattlegroundsAppState.findParentCategoryInternal(cat.categories, categoryId);
			if (sub) {
				return sub;
			}
		}
		return null;
	}

	public static extractCategory(category: BattlegroundsCategory): readonly BattlegroundsCategory[] {
		if (!category.categories || category.categories.length === 0) {
			return [category];
		}
		return [
			category,
			...category.categories
				.map((cat) => BattlegroundsAppState.extractCategory(cat))
				.reduce((a, b) => a.concat(b), []),
		];
	}
}
