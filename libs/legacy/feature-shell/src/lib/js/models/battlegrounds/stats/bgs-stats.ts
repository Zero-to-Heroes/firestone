import { BgsGlobalHeroStat2, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';
import { AppInjector } from '../../../services/app-injector';
import { LazyDataInitService } from '../../../services/lazy-data-init.service';
import { NonFunctionProperties } from '../../../services/utils';

export class BgsStats {
	readonly lastUpdateDate: string;
	readonly mmrPercentiles: readonly MmrPercentile[];
	readonly allTribes: readonly Race[];
	readonly heroStats: readonly BgsGlobalHeroStat2[];

	readonly questStats: readonly BgsGlobalHeroStat2[] = undefined;

	public static create(result: Partial<NonFunctionProperties<BgsStats>>) {
		return Object.assign(new BgsStats(), result);
	}

	public update(base: Partial<NonFunctionProperties<BgsStats>>) {
		return Object.assign(new BgsStats(), this, base);
	}

	public getQuestStats(): readonly BgsGlobalHeroStat2[] {
		if (this.questStats === undefined) {
			console.log('bgs quest stats not initialized yet');
			(this.questStats as readonly BgsGlobalHeroStat2[]) = [];
			AppInjector.get<LazyDataInitService>(LazyDataInitService).requestLoad('bgs-quest-stats');
		}
		return this.questStats;
	}
}
