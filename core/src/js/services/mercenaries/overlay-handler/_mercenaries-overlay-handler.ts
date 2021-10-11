import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../models/preferences';

export interface MercenariesOverlayHandler {
	updateOverlay(state: MercenariesBattleState): Promise<void>;
	handleDisplayPreferences(preferences: Preferences): Promise<void>;
}
