import { GameEvent } from '../../../models/game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryShouldTrackProcessor implements LotteryProcessor {
	process(currentState: LotteryState, event: GameEvent): LotteryState {
		const shouldTrack = event.additionalData.shuoldTrack;
		return currentState.update({
			shouldTrack: shouldTrack,
		});
	}
}
