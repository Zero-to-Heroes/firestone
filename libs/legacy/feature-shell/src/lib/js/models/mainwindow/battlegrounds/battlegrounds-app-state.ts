import { BgsPostMatchStatsForReview } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { BattlegroundsCategory } from './battlegrounds-category';

export class BattlegroundsAppState {
	readonly categories: readonly BattlegroundsCategory[] = [];

	readonly lastHeroPostMatchStats: readonly BgsPostMatchStatsForReview[];
	readonly lastHeroPostMatchStatsHeroId: string;

	public static create(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattlegroundsAppState>>): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), this, base);
	}
}
