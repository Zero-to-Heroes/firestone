import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class DeathrattleTriggeredReq implements Requirement {
	private hasTriggered: boolean;

	constructor(private readonly targetCardId: string, readonly individualResetEvents: readonly string[]) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for DeathrattleTriggeredReq', rawReq);
		}
		return new DeathrattleTriggeredReq(rawReq.values[0], rawReq.individualRestEvents);
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
		if (gameEvent.type === GameEvent.DEATHRATTLE_TRIGGERED) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (gameEvent.controllerId == gameEvent.localPlayer.PlayerId && this.targetCardId === gameEvent.cardId) {
			this.hasTriggered = true;
		}
	}
}
