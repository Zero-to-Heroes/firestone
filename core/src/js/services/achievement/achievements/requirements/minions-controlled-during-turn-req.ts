import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class MinionsControlledDuringTurnReq implements Requirement {
	private numberOfMinions: number;

	constructor(
		private readonly minionCardId: string,
		private readonly targetNumberOfMinions: number,
		private readonly qualifier: string,
	) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for MinionsControlledDuringTurnReq', rawReq);
		}
		return new MinionsControlledDuringTurnReq(rawReq.values[0], parseInt(rawReq.values[1]), rawReq.values[2]);
	}

	reset(): void {
		this.numberOfMinions = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.numberOfMinions = undefined;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.numberOfMinions >= this.targetNumberOfMinions;
		}
		return this.numberOfMinions === this.targetNumberOfMinions;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.gameState) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (gameEvent.gameState && gameEvent.gameState.Player && gameEvent.gameState.Player.Board) {
			const board = gameEvent.gameState.Player.Board;
			this.numberOfMinions = board.filter((entity) => entity.cardId === this.minionCardId).length;
		}
	}
}
