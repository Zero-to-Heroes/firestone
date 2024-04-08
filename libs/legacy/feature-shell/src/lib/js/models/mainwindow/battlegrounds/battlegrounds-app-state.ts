import { BgsPostMatchStatsForReview } from '@firestone/battlegrounds/common';
import { NonFunctionProperties } from '../../../services/utils';
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

	public static create(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattlegroundsAppState>>): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), this, base);
	}
}
