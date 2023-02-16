import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { AppInjector } from '../../../services/app-injector';
import { BgsHeroStrategies } from '../../../services/battlegrounds/bgs-meta-hero-strategies.service';
import { LazyDataInitService } from '../../../services/lazy-data-init.service';
import { NonFunctionProperties } from '../../../services/utils';
import { BgsPostMatchStatsForReview } from '../../battlegrounds/bgs-post-match-stats-for-review';
import { BgsStats } from '../../battlegrounds/stats/bgs-stats';
import { PatchInfo } from '../../patches';
import { GameStat } from '../stats/game-stat';
import { BattlegroundsCategory } from './battlegrounds-category';
import { BgsCustomSimulationState } from './simulator/bgs-custom-simulation-state';

export class BattlegroundsAppState {
	readonly loading: boolean = true;
	readonly categories: readonly BattlegroundsCategory[] = [];
	readonly globalStats: BgsStats = new BgsStats();
	readonly currentBattlegroundsMetaPatch: PatchInfo;
	readonly customSimulationState: BgsCustomSimulationState = new BgsCustomSimulationState();

	readonly lastHeroPostMatchStats: readonly BgsPostMatchStatsForReview[];
	readonly lastHeroPostMatchStatsHeroId: string;

	// See decktracker-state.ts for more info
	readonly perfectGames: readonly GameStat[] = undefined;
	readonly metaHeroStats: BgsHeroStatsV2 = undefined;
	readonly metaHeroStrategies: BgsHeroStrategies = undefined;

	public static create(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattlegroundsAppState>>): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), this, base);
	}

	public getPerfectGames(): readonly GameStat[] {
		if (this.perfectGames === undefined) {
			console.log('perfectGames not initialized yet');
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (service) {
				(this.perfectGames as readonly GameStat[]) = [];
				service.requestLoad('battlegrounds-perfect-games');
			}
		}
		return this.perfectGames;
	}

	public getMetaHeroStats(): BgsHeroStatsV2 {
		if (this.metaHeroStats === undefined) {
			console.log('metaHeroStats not initialized yet');
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (service) {
				(this.metaHeroStats as BgsHeroStatsV2) = null;
				service.requestLoad('bgs-meta-hero-stats');
			}
		}
		return this.metaHeroStats;
	}

	public getMetaHeroStrategies(): BgsHeroStrategies {
		if (this.metaHeroStrategies === undefined) {
			console.log('metaHeroStrategies not initialized yet');
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (service) {
				(this.metaHeroStrategies as BgsHeroStrategies) = null;
				service.requestLoad('bgs-meta-hero-strategies');
			}
		}
		return this.metaHeroStrategies;
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
