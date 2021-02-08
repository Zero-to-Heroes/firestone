import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class RumbleRunStepReq implements Requirement {
	private isCorrectStep: boolean = true;
	private assignedStep: boolean;

	constructor(private readonly targetStep: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for RumbleRunStepReq', rawReq);
		}
		return new RumbleRunStepReq(parseInt(rawReq.values[0]));
	}

	// Default to true because no event is sent in the first round of a rumble run match
	// The scenario ID + the fact that achievements only complete once should be enough
	// to work around this limitation
	reset(): void {
		this.isCorrectStep = true;
		this.assignedStep = false;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectStep = true;
		this.assignedStep = false;
	}

	isCompleted(): boolean {
		return this.isCorrectStep;
	}

	test(gameEvent: GameEvent): void {
		if (!this.assignedStep && gameEvent.type === GameEvent.RUMBLE_RUN_STEP) {
			this.isCorrectStep = gameEvent.additionalData.step === this.targetStep;
			// console.log('[debug] is correct step?', this.isCorrectStep, gameEvent, this.targetStep);
			this.assignedStep = true;
		}
	}
}
