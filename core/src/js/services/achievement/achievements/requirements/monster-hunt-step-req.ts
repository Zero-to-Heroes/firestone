import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class MonsterHuntStepReq implements Requirement {
	private isCorrectStep = false;
	private assignedStep: boolean;

	constructor(private readonly targetStep: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for MonsterHuntStepReq', rawReq);
		}
		return new MonsterHuntStepReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.isCorrectStep = false;
		this.assignedStep = false;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectStep = false;
		this.assignedStep = false;
	}

	isCompleted(): boolean {
		return this.isCorrectStep;
	}

	test(gameEvent: GameEvent): void {
		// Because of how computing the step value for monter hunt had to change, it's now
		// possible to receive the event several times in a match
		if (!this.assignedStep && gameEvent.type === GameEvent.MONSTER_HUNT_STEP) {
			this.isCorrectStep = gameEvent.additionalData.step === this.targetStep;
			this.assignedStep = true;
		}
	}
}
