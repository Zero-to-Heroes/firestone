import { GameEvent } from '../../../models/game-event';
import { LotteryState } from '../lottery.model';

export interface LotteryProcessor {
	process(value: LotteryState, event: GameEvent): LotteryState;
}
