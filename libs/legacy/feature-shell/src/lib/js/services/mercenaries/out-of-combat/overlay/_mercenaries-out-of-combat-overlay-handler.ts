import { SceneMode } from '@firestone-hs/reference-data';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Preferences } from '../../../../models/preferences';

export interface MercenariesOutOfCombatOverlayHandler {
	updateOverlay(state: MercenariesOutOfCombatState, currentScene: SceneMode, preferences: Preferences): Promise<void>;
}
