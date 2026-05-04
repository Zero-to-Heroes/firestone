import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class MercenariesOutOfCombatState {
	readonly treasureSelection: TreasureSelection;

	public update(base: Partial<NonFunctionProperties<MercenariesOutOfCombatState>>): MercenariesOutOfCombatState {
		return Object.assign(new MercenariesOutOfCombatState(), this, base);
	}
}

export interface TreasureSelection {
	readonly treasureIds: readonly number[];
}
