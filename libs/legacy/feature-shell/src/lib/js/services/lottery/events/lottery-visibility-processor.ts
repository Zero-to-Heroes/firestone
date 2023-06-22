import { GameEvent } from '../../../models/game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryVisibilityProcessor implements LotteryProcessor {
	process(currentState: LotteryState, event: GameEvent): LotteryState {
		const visible = event.additionalData.visible;
		return currentState.update({
			visible: visible,
		});
	}
}
