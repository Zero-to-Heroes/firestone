import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatsResourcesWastedPerTurnParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.RESOURCES_UPDATED;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		if (controllerId !== localPlayer?.PlayerId) {
			return currentState;
		}

		const resourcesAvailable = gameEvent.additionalData.resourcesTotal;
		const resourcesUsedThisTurn = gameEvent.additionalData.resourcesUsed;
		const resourcesWastedThisTurn = resourcesAvailable - resourcesUsedThisTurn;
		const resourcesWastedPerTurn: readonly NumericTurnInfo[] = [
			...currentState.coinsWastedOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: resourcesWastedThisTurn,
			},
		];

		return currentState.update({
			resourcesAvailableThisTurn: resourcesAvailable,
			resourcesUsedThisTurn: resourcesUsedThisTurn,
			coinsWastedOverTurn: resourcesWastedPerTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsResourcesWastedPerTurnParser';
	}
}
