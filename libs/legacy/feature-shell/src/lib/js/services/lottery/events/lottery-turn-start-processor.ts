import { GameEvent } from '../../../models/game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryTurnStartProcessor implements LotteryProcessor {
	process(currentState: LotteryState, event: GameEvent): LotteryState {
		return currentState.update({
			totalResourcesUsed: currentState.totalResourcesUsed + currentState.resourcesUsedThisTurn,
			resourcesUsedThisTurn: 0,
		});
	}
}
