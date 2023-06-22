import { GameEvent } from '../../../models/game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryResourcesUpdateProcessor implements LotteryProcessor {
	process(currentState: LotteryState, event: GameEvent): LotteryState {
		if (!currentState.visible) {
			return currentState;
		}

		const [, controllerId, localPlayer] = event.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		console.debug(
			'[lottery] resources used this turn',
			isPlayer,
			event.additionalData.resourcesUsed,
			event,
			currentState,
		);
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
