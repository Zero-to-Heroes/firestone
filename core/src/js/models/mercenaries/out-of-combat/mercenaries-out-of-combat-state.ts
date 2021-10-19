import { ReferenceCard, SceneMode } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '../../../services/utils';
import { MemoryVisitor } from '../../memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../memory/memory-mercenaries-info';

export class MercenariesOutOfCombatState {
	readonly visitorsInfo: readonly MemoryVisitor[];
	readonly mercenariesMemoryInfo: MemoryMercenariesInfo;
	readonly currentScene: SceneMode;
	readonly treasureSelection: TreasureSelection;

	public update(base: Partial<NonFunctionProperties<MercenariesOutOfCombatState>>): MercenariesOutOfCombatState {
		return Object.assign(new MercenariesOutOfCombatState(), this, base);
	}
}

export interface TreasureSelection {
	readonly treasures: readonly ReferenceCard[];
}
