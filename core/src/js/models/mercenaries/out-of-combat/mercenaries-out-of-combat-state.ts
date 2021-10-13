import { SceneMode } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '../../../services/utils';
import { MemoryMercenariesInfo } from '../../memory/memory-mercenaries-info';

export class MercenariesOutOfCombatState {
	readonly mercenariesMemoryInfo: MemoryMercenariesInfo;
	readonly currentScene: SceneMode;

	public update(base: Partial<NonFunctionProperties<MercenariesOutOfCombatState>>): MercenariesOutOfCombatState {
		return Object.assign(new MercenariesOutOfCombatState(), this, base);
	}
}
