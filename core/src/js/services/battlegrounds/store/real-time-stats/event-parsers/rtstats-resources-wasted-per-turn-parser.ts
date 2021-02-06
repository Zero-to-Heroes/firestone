import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatsResourcesWastedPerTurnParser implements EventParser {
	constructor(private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return (
			gameEvent.type === GameEvent.RESOURCES_THIS_TURN || gameEvent.type === GameEvent.RESOURCES_USED_THIS_TURN
		);
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (controllerId !== localPlayer.PlayerId) {
			return currentState;
		}

		const resources = gameEvent.additionalData.resources;
		const resourcesThisTurn =
			gameEvent.type === GameEvent.RESOURCES_THIS_TURN ? resources : currentState.resourcesAvailableThisTurn;
		const resourcesUsedThisTurn =
			gameEvent.type === GameEvent.RESOURCES_USED_THIS_TURN ? resources : currentState.resourcesUsedThisTurn;
		const resourcesWastedThisTurn = resourcesThisTurn - resourcesUsedThisTurn;
		const resourcesWastedPerTurn = {
			...currentState.resourcesWastedPerTurn,
			[currentState.currentTurn]: resourcesWastedThisTurn,
		};
		return currentState.update({
			resourcesWastedPerTurn: resourcesWastedPerTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsResourcesWastedPerTurnParser';
	}
}
