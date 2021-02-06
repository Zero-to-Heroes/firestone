import { GameTag } from '@firestone-hs/reference-data';
import { GameEvent } from '../../../../../../models/game-event';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsBoardStatsParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.BATTLEGROUNDS_PLAYER_BOARD;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		if (gameEvent.additionalData.playerBoard?.board?.length > 7) {
			return currentState;
		}

		const currentStats: number = gameEvent.additionalData.playerBoard.board
			?.map(entity => this.extractAttack(entity) + this.extractHealth(entity))
			.reduce((a, b) => a + b, 0);
		console.debug(this.name(), 'currentStats', currentStats);
		return currentState.update({
			bgsMaxBoardStats: Math.max(currentState.bgsMaxBoardStats, currentStats),
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsBoardStatsParser';
	}

	private extractAttack(entity): number {
		return entity.Tags.find(tag => tag.Name === GameTag.ATK)?.Value ?? 0;
	}

	private extractHealth(entity): number {
		return entity.Tags.find(tag => tag.Name === GameTag.HEALTH)?.Value ?? 0;
	}
}
