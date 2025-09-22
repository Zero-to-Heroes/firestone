import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { LotteryState } from '../lottery.model';

export interface LotteryProcessor {
	process(value: LotteryState, event: GameEvent): LotteryState;
}
