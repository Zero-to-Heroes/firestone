import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class CorrectOpponentReq implements Requirement {
	private isCorrectOpponent: boolean;

	constructor(private readonly cardIds: readonly string[]) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for CorrectOpponentReq', rawReq);
		}
		return new CorrectOpponentReq(rawReq.values);
	}

	reset(): void {
		this.isCorrectOpponent = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectOpponent = undefined;
	}

	isCompleted(): boolean {
		return this.isCorrectOpponent;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.OPPONENT) {
			this.detectGameResultEvent(gameEvent);
			return;
		}
	}

	private detectGameResultEvent(gameEvent: GameEvent) {
		const opponentPlayer = gameEvent.opponentPlayer;
		if (this.cardIds.indexOf(opponentPlayer.CardID) !== -1) {
			this.isCorrectOpponent = true;
		}
	}
}
