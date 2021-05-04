import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatHeroPowerUsedParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.HERO_POWER_USED;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		const existingUse =
			currentState.mainPlayerHeroPowersOverTurn.find((info) => info.turn === currentState.currentTurn)?.value ??
			0;
		const newPowers: readonly NumericTurnInfo[] = [
			...currentState.mainPlayerHeroPowersOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: existingUse + 1,
			},
		];

		return currentState.update({
			mainPlayerHeroPowersOverTurn: newPowers,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatHeroPowerUsedParser';
	}
}
