import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';

export interface EventParser {
	applies(gameEvent: GameEvent): boolean;
	parse(currentState: BattlegroundsState, gameEvent: GameEvent): Promise<BattlegroundsState>;
	event(): string;
}
