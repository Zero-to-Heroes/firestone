import { GameEvent } from '@firestone/game-state';
import { MercenariesBattleState } from '../services/mercenaries-battle-state';

export interface MercenariesParser {
	eventType(): string;
	applies(battleState: MercenariesBattleState): boolean;
	parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState>;
}
