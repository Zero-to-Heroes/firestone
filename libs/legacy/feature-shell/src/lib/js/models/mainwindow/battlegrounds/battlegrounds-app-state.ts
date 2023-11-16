import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { AppInjector } from '@firestone/shared/framework/core';
import { BgsHeroStrategies } from '../../../services/battlegrounds/bgs-meta-hero-strategies.service';
import { LazyDataInitService } from '../../../services/lazy-data-init.service';
import { NonFunctionProperties } from '../../../services/utils';
import { BgsPostMatchStatsForReview } from '../../battlegrounds/bgs-post-match-stats-for-review';
import { BattlegroundsCategory } from './battlegrounds-category';
import { BgsCustomSimulationState } from './simulator/bgs-custom-simulation-state';

export class BattlegroundsAppState {
	// readonly loading: boolean = true;
	readonly categories: readonly BattlegroundsCategory[] = [];
	// Is this really useful apart from getting the tribes and mmr percentiles?
	// readonly globalStats: BgsStats = new BgsStats();
	// readonly currentBattlegroundsMetaPatch: PatchInfo;
	readonly customSimulationState: BgsCustomSimulationState = new BgsCustomSimulationState();

	readonly lastHeroPostMatchStats: readonly BgsPostMatchStatsForReview[];
	readonly lastHeroPostMatchStatsHeroId: string;

	readonly metaHeroStats: BgsHeroStatsV2 = undefined;
	readonly metaHeroStrategies: BgsHeroStrategies = undefined;

	public static create(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattlegroundsAppState>>): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), this, base);
	}

	public getMetaHeroStats(): BgsHeroStatsV2 {
		// Hack, see store-bootstrap.service.ts
		// if (!this.initComplete) {
		// 	return this.metaHeroStats;
		// }
		if (this.metaHeroStats === undefined) {
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (service) {
				(this.metaHeroStats as BgsHeroStatsV2) = null;
				service.requestLoad('bgs-meta-hero-stats');
			}
		}
		return this.metaHeroStats;
	}

	public getMetaHeroStrategies(): BgsHeroStrategies {
		// if (!this.initComplete) {
		// 	return this.metaHeroStrategies;
		// }
		if (this.metaHeroStrategies === undefined) {
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (service) {
				(this.metaHeroStrategies as BgsHeroStrategies) = null;
				service.requestLoad('bgs-meta-hero-strategies');
			}
		}
		return this.metaHeroStrategies;
	}
}
