import { SceneMode } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MemoryUpdate } from '../../../../models/memory/memory-update';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { BroadcastEvent, Events } from '../../../events.service';
import { MercenariesOutOfCombatParser } from './_mercenaries-out-of-combat-parser';

export class MercenariesTreasureSelectionParser implements MercenariesOutOfCombatParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => Events.MEMORY_UPDATE;

	public applies = (state: MercenariesOutOfCombatState) => !!state;

	async parse(
		state: MercenariesOutOfCombatState,
		event: BroadcastEvent,
		currentScene: SceneMode,
	): Promise<MercenariesOutOfCombatState> {
		const changes: MemoryUpdate = event.data[0];
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
