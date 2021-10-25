import { SceneMode } from '@firestone-hs/reference-data';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MemoryUpdate } from '../../../../models/memory/memory-update';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { CardsFacadeService } from '../../../cards-facade.service';
import { BroadcastEvent, Events } from '../../../events.service';
import { MercenariesOutOfCombatParser } from './_mercenaries-out-of-combat-parser';

export class MercenariesTreasureSelectionParser implements MercenariesOutOfCombatParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => Events.MEMORY_UPDATE;

	public applies = (state: MercenariesOutOfCombatState) => !!state;

	async parse(
		state: MercenariesOutOfCombatState,
		event: BroadcastEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesOutOfCombatState> {
		const changes: MemoryUpdate = event.data[0];
		if (state.currentScene !== SceneMode.LETTUCE_MAP && changes.CurrentScene !== SceneMode.LETTUCE_MAP) {
			return state;
		}

		if (changes.IsMercenariesSelectingTreasure && changes.MercenariesPendingTreasureSelection) {
			const result = state.update({
				treasureSelection: {
					treasures: changes.MercenariesPendingTreasureSelection.Options.map((option) =>
						this.allCards.getCardFromDbfId(option),
					),
				},
			});
			return result;
		} else if (changes.IsMercenariesSelectingTreasure == null) {
			return state;
		} else if (changes.IsMercenariesSelectingTreasure == false) {
			return state.update({ treasureSelection: null });
		}
		console.warn('invalid case', changes);
		return state;
	}
}
