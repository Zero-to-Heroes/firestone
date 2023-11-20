// import { ArchetypeConfig } from '@firestone-hs/categorize-deck/dist/archetype-service';
// import { ArchetypeStats } from '@firestone-hs/cron-build-ranked-archetypes/dist/archetype-stats';
import { NonFunctionProperties } from '../../../services/utils';

import { StatsCategory } from './stats-category';
import { StatsFilters } from './stats-filters';

export class StatsState {
	readonly loading: boolean = true;
	readonly categories: readonly StatsCategory[] = [];
	readonly filters: StatsFilters = new StatsFilters();

	// readonly gameStats: GameStats = new GameStats();
	// readonly archetypesConfig: readonly ArchetypeConfig[];
	// readonly archetypesStats: ArchetypeStats;

	// readonly bestBgsUserStats: readonly BgsBestStat[] = undefined;

	readonly initComplete: boolean = false;

	public static create(base: Partial<NonFunctionProperties<StatsState>>): StatsState {
		return Object.assign(new StatsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<StatsState>>): StatsState {
		return Object.assign(new StatsState(), this, base);
	}

	// public updateBgsPostMatchStats(
	// 	reviewId: string,
	// 	postMatchStats: BgsPostMatchStats,
	// 	gameStats: GameStatsLoaderService,
	// ): StatsState {
	// 	const newGameStats: GameStats = gameStats.updateBgsPostMatchStats(reviewId, postMatchStats);
	// 	return this.update({
	// 		gameStats: newGameStats,
	// 	} as StatsState);
	// }

	public findCategory(categoryId: string): StatsCategory {
		const result = this.categories?.find((cat) => cat.id === categoryId);
		return result;
	}
}
