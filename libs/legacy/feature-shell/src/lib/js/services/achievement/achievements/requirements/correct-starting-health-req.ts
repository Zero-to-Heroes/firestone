import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class CorrectStartingHealthReq implements Requirement {
	private isCorrectStartingHealth: boolean;
	private hasDefChangeOccured: boolean;

	constructor(private readonly targetCardId: string, private readonly targetStartingHealth: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 2) {
			console.error('invalid parameters for CorrectStartingHealthReq', rawReq);
		}
		return new CorrectStartingHealthReq(rawReq.values[0], parseInt(rawReq.values[1]));
	}

	reset(): void {
		this.isCorrectStartingHealth = undefined;
		this.hasDefChangeOccured = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectStartingHealth = undefined;
		this.hasDefChangeOccured = undefined;
	}

	isCompleted(): boolean {
		return this.isCorrectStartingHealth;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.CARD_ON_BOARD_AT_GAME_START) {
			this.handleEvent(gameEvent);
			return;
		}
		if (gameEvent.type === GameEvent.HEALTH_DEF_CHANGED) {
			this.handleDefChangeEvent(gameEvent);
			return;
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (
			gameEvent.cardId === this.targetCardId &&
			gameEvent.additionalData &&
			gameEvent.additionalData.health === this.targetStartingHealth &&
			!this.hasDefChangeOccured
		) {
			this.isCorrectStartingHealth = true;
		}
	}

	private handleDefChangeEvent(gameEvent: GameEvent) {
		// Starting health check is to avoid invalidating the starting health if it was correct
		if (gameEvent.cardId === this.targetCardId && !this.hasDefChangeOccured && !this.isCorrectStartingHealth) {
			this.hasDefChangeOccured = true;
			this.isCorrectStartingHealth = gameEvent.additionalData.newHealth === this.targetStartingHealth;
		}
	}
}
