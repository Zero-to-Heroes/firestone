import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class MonsterHuntStepReq implements Requirement {
	private isCorrectStep: boolean;

	constructor(private readonly targetStep: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for MonsterHuntStepReq', rawReq);
		}
		return new MonsterHuntStepReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.isCorrectStep = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectStep = undefined;
	}

	isCompleted(): boolean {
		return this.isCorrectStep;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MONSTER_HUNT_STEP) {
			this.isCorrectStep = gameEvent.additionalData.step === this.targetStep;
		}
	}
}
