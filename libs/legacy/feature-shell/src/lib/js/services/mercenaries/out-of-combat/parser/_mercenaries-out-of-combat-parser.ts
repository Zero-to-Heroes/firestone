import { SceneMode } from '@firestone-hs/reference-data';
import { MemoryUpdate } from '@firestone/memory';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';

export interface MercenariesOutOfCombatParser {
	applies(state: MercenariesOutOfCombatState): boolean;
	parse(
		state: MercenariesOutOfCombatState,
		changes: MemoryUpdate,
		currentScene: SceneMode,
	): MercenariesOutOfCombatState | PromiseLike<MercenariesOutOfCombatState>;
}
