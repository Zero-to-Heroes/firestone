import { SceneMode } from '@firestone-hs/reference-data';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { BroadcastEvent } from '../../../events.service';

export interface MercenariesOutOfCombatParser {
	eventType(): string;
	applies(state: MercenariesOutOfCombatState): boolean;
	parse(
		state: MercenariesOutOfCombatState,
		event: BroadcastEvent,
		currentScene: SceneMode,
	): MercenariesOutOfCombatState | PromiseLike<MercenariesOutOfCombatState>;
}
