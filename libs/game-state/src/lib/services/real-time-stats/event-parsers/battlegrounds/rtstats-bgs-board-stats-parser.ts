import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsBoard, RealTimeStatsState } from '../../../../models/_barrel';
import { buildEntities } from '../../../battlegrounds/bgs-board-utils';
import { GameEvent } from '../../../game-events/game-event';
import { EventParser } from '../_event-parser';

export class RTStatsBgsBoardStatsParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_PLAYER_BOARD;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		if (!gameEvent.additionalData.playerBoard?.board || gameEvent.additionalData.playerBoard?.board?.length > 7) {
			return currentState;
		}

		const board = buildEntities(gameEvent.additionalData.playerBoard.board);
		const newHistory: readonly BgsBoard[] = [
			...(currentState.boardHistory || []),
			BgsBoard.create({
				board: board,
				turn: currentState.currentTurn,
			}),
		];

		const totalStatsOverTurn: readonly NumericTurnInfo[] = [
			...currentState.totalStatsOverTurn,
			{
				turn: currentState.currentTurn,
				value: this.buildTotalStats(board),
			},
		];

		return currentState.update({
			boardHistory: newHistory,
			totalStatsOverTurn: totalStatsOverTurn,
		} as RealTimeStatsState);
	}

	private buildTotalStats(entities: readonly Entity[]): number {
		return entities
			.map((entity) => (entity.tags[GameTag[GameTag.ATK]] || 0) + (entity.tags[GameTag[GameTag.HEALTH]] || 0))
			.reduce((a, b) => a + b, 0);
	}

	name(): string {
		return 'RTStatsBgsBoardStatsParser';
	}
}
