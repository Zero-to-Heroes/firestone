import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class DungeonRunStepReq implements Requirement {
	private isCorrectStep = false;
	private assignedStep: boolean;

	constructor(private readonly targetStep: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for DungeonRunStepReq', rawReq);
		}
		return new DungeonRunStepReq(parseInt(rawReq.values[0]));
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
		if (!this.assignedStep && gameEvent.type === GameEvent.DUNGEON_RUN_STEP) {
			this.isCorrectStep = gameEvent.additionalData.step === this.targetStep;
			this.assignedStep = true;
		}
	}
}
