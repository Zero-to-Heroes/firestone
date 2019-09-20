import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class SecretTriggeredReq implements Requirement {
	private hasTriggered: boolean;

	constructor(private readonly targetSecret: string, readonly individualResetEvents: readonly string[]) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for SecretTriggeredReq', rawReq);
		}
		return new SecretTriggeredReq(rawReq.values[0], rawReq.individualRestEvents);
	}

	reset(): void {
		this.hasTriggered = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.hasTriggered = undefined;
	}

	isCompleted(): boolean {
		return this.hasTriggered;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.SECRET_TRIGGERED) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (gameEvent.controllerId == gameEvent.localPlayer.PlayerId && this.targetSecret === gameEvent.cardId) {
			this.hasTriggered = true;
		}
	}
}
