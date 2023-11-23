import { Preferences } from '@firestone/shared/common/service';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';

export interface MercenariesOverlayHandler {
	updateOverlay(state: MercenariesBattleState, preferences: Preferences): Promise<void>;
}
