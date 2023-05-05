import { TavernBrawlStats } from '@firestone-hs/tavern-brawl-stats';
import { NonFunctionProperties } from '@services/utils';
import { AppInjector } from '../../js/services/app-injector';
import { LazyDataInitService } from '../../js/services/lazy-data-init.service';

export class TavernBrawlState {
	// See decktracker-state.ts for more info
	readonly currentStats: TavernBrawlStats = undefined;

	// Navigation
	readonly categories: readonly TavernBrawlCategoryType[] = ['meta'];
	readonly selectedCategoryId: TavernBrawlCategoryType = 'meta';
	readonly menuDisplayType: 'menu' | 'breadcrumbs' = 'menu';

	public static create(base: Partial<NonFunctionProperties<TavernBrawlState>>): TavernBrawlState {
		return Object.assign(new TavernBrawlState(), base);
	}

	public update(base: Partial<NonFunctionProperties<TavernBrawlState>>): TavernBrawlState {
		return Object.assign(new TavernBrawlState(), this, base);
	}

	public getCurrentStats(): TavernBrawlStats {
		if (this.currentStats === undefined) {
			console.log('currentStats not initialized yet');
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (!!service) {
				(this.currentStats as TavernBrawlStats) = null;
				service.requestLoad('tavern-brawl-stats');
			}
		}
		return this.currentStats;
	}
}

export type TavernBrawlCategoryType = 'meta';
