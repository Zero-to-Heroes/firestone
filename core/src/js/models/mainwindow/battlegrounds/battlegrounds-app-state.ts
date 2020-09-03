import { BattlegroundsGlobalCategory } from './battlegrounds-global-category';

export class BattlegroundsAppState {
	readonly globalCategories: readonly BattlegroundsGlobalCategory[] = [];
	readonly loading: boolean = true;

	public static create(base: BattlegroundsAppState): BattlegroundsAppState {
		return Object.assign(new BattlegroundsAppState(), base);
	}
}
