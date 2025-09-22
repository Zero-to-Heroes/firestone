import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryShouldTrackProcessor implements LotteryProcessor {
	process(currentState: LotteryState, event: GameEvent): LotteryState {
		const shouldTrack = event.additionalData.shouldTrack;
		// console.debug('[lottery] shouldTrack event', shouldTrack, event);
		return currentState.update({
			shouldTrack: shouldTrack,
		});
	}
}
