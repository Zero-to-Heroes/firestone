import { ReferenceCard } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '../../../services/utils';

export class MercenariesOutOfCombatState {
	readonly treasureSelection: TreasureSelection;

	public update(base: Partial<NonFunctionProperties<MercenariesOutOfCombatState>>): MercenariesOutOfCombatState {
		return Object.assign(new MercenariesOutOfCombatState(), this, base);
	}
}

export interface TreasureSelection {
	readonly treasures: readonly ReferenceCard[];
}
