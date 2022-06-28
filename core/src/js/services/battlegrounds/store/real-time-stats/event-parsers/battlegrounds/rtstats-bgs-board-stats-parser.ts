import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag } from '@firestone-hs/reference-data';
import { BgsBoard } from '../../../../../../models/battlegrounds/in-game/bgs-board';
import { GameEvent } from '../../../../../../models/game-event';
import { isBattlegrounds } from '../../../../bgs-utils';
import { BgsPlayerBoardParser } from '../../../event-parsers/bgs-player-board-parser';
import { RealTimeStatsState } from '../../real-time-stats';
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

		const board = BgsPlayerBoardParser.buildEntities(gameEvent.additionalData.playerBoard.board);
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
			.map(
				(entity) =>
					(entity.tags.get(GameTag[GameTag.ATK]) || 0) + (entity.tags.get(GameTag[GameTag.HEALTH]) || 0),
			)
			.reduce((a, b) => a + b, 0);
	}

	name(): string {
		return 'RTStatsBgsBoardStatsParser';
	}
}
