import { BgsStats } from '../../battlegrounds/stats/bgs-stats';
import { BattlegroundsGlobalCategory } from './battlegrounds-global-category';
import { BgsActiveTimeFilterType } from './bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from './bgs-hero-sort-filter.type';

export class BattlegroundsAppState {
	readonly globalCategories: readonly BattlegroundsGlobalCategory[] = [];
	readonly loading: boolean = true;
	// The global stats coming from the DB (so without the player info)
	readonly globalStats: BgsStats;
	// The stats used by the app (so a mix a globalStats + matchStats + filters)
	readonly stats: BgsStats;
	readonly activeTimeFilter: BgsActiveTimeFilterType;
	readonly activeHeroSortFilter: BgsHeroSortFilterType;

	public static create(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), base);
	}

	public update(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), this, base);
	}
}
