import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class CorrectOpponentReq implements Requirement {
	private isCorrectOpponent: boolean;

	constructor(private readonly cardId: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for CorrectOpponentReq', rawReq);
		}
		return new CorrectOpponentReq(rawReq.values[0]);
	}

	reset(): void {
		this.isCorrectOpponent = undefined;
	}

	afterAchievementCompletionReset(): void {
		// Do nothing, the opponent stays the same during the whole game
	}

	isCompleted(): boolean {
		return this.isCorrectOpponent;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.WINNER) {
			this.detectGameResultEvent(gameEvent);
			return;
		}
	}

	private detectGameResultEvent(gameEvent: GameEvent) {
		const opponentPlayer = gameEvent.opponentPlayer;
		if (opponentPlayer.CardID === this.cardId) {
			this.isCorrectOpponent = true;
		}
	}
}
