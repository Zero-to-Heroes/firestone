import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryResourcesUpdateProcessor implements LotteryProcessor {
	process(currentState: LotteryState, event: GameEvent): LotteryState {
		if (!currentState.shouldTrack) {
			// console.debug('[lottery] not tracking, ignoring event', event);
			return currentState;
		}

		const [, controllerId, localPlayer] = event.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}
		// Because of how events are ordered, we can have multiple events in a row for each of the
		// individual values (resourcesUsed, resourcesTotal)
		const resourcesUsedThisTurn = event.additionalData.resourcesUsed;
		return currentState.update({
			resourcesUsedThisTurn: resourcesUsedThisTurn,
		});
	}
}
