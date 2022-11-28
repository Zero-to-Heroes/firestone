import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../models/preferences';

export interface MercenariesOverlayHandler {
	updateOverlay(state: MercenariesBattleState, preferences: Preferences): Promise<void>;
}
