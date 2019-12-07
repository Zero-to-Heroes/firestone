import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { BattlegroundsEvent } from '../events/battlegrounds-event';

export interface EventParser {
	applies(gameEvent: GameEvent | BattlegroundsEvent): boolean;
	parse(currentState: BattlegroundsState, gameEvent: GameEvent | BattlegroundsEvent): Promise<BattlegroundsState>;
	event(): string;
}
