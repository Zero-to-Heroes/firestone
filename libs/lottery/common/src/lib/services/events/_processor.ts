import { GameEvent } from '@firestone/game-state';
import { LotteryState } from '../lottery.model';

export interface LotteryProcessor {
	process(value: LotteryState, event: GameEvent): LotteryState;
}

