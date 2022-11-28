import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { AbstractRequirement } from './_abstract-requirement';
import { Requirement } from './_requirement';

export class SecretTriggeredReq extends AbstractRequirement {
	private hasTriggered: boolean;

	constructor(private readonly targetSecret: string) {
		super();
	}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for SecretTriggeredReq', rawReq);
		}
		const req = new SecretTriggeredReq(rawReq.values[0]);
		req.individualResetEvents = rawReq.individualRestEvents;
		return req;
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
		if (gameEvent.controllerId == gameEvent.localPlayer?.PlayerId && this.targetSecret === gameEvent.cardId) {
			this.hasTriggered = true;
		}
	}
}
