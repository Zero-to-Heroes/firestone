import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { RealTimeStatsState } from '../../../../models/_barrel';
import { GameEvent } from '../../../game-events/game-event';
import { EventParser } from '../_event-parser';

export class RTStatBgsDiscoversParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.ENTITY_CHOSEN;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		const discoversThisTurn =
			currentState.discoversOverTurn.find((info) => info.turn === currentState.currentTurn)?.value ?? 0;
		const newDiscovers: readonly NumericTurnInfo[] = [
			...currentState.discoversOverTurn.filter((info) => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: discoversThisTurn + 1,
			},
		];

		return currentState.update({
			discoversOverTurn: newDiscovers,
		});
	}

	name(): string {
		return 'RTStatBgsDiscoversParser';
	}
}
