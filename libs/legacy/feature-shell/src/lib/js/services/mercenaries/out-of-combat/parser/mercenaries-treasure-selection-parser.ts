import { SceneMode } from '@firestone-hs/reference-data';
import { MemoryUpdate } from '@firestone/memory';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { MercenariesOutOfCombatParser } from './_mercenaries-out-of-combat-parser';

export class MercenariesTreasureSelectionParser implements MercenariesOutOfCombatParser {
	public applies = (state: MercenariesOutOfCombatState) => !!state;

	async parse(
		state: MercenariesOutOfCombatState,
		changes: MemoryUpdate,
		currentScene: SceneMode,
	): Promise<MercenariesOutOfCombatState> {
		if (changes.MercenariesTreasureSelectionIndex != null && changes.MercenariesPendingTreasureSelection) {
			const result = state.update({
				treasureSelection: {
					treasureIds: changes.MercenariesPendingTreasureSelection.Options,
				},
			});
			return result;
		} else if (changes.MercenariesTreasureSelectionIndex == null) {
			return state;
		} else if (changes.MercenariesTreasureSelectionIndex == -1) {
			return state.update({ treasureSelection: null });
		}
		// Can happen when selecting a treasure for Duels (it's the same event that is sent)
		// console.warn('invalid case', changes);
		return state;
	}
}
