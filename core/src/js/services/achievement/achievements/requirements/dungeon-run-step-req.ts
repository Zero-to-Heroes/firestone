import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class DungeonRunStepReq implements Requirement {
	private isCorrectStep = true;
	private assignedStep: boolean;

	constructor(private readonly targetStep: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for DungeonRunStepReq', rawReq);
		}
		return new DungeonRunStepReq(parseInt(rawReq.values[0]));
	}

	// Default to true because no event is sent in the first round of a match
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
		if (!this.assignedStep && gameEvent.type === GameEvent.DUNGEON_RUN_STEP) {
			this.isCorrectStep = gameEvent.additionalData.step === this.targetStep;
			this.assignedStep = true;
		}
	}
}
