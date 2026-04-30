import { RawRequirement } from '@firestone/achievements/common';
import { GameEvent } from '@firestone/game-state';
import { Requirement } from './_requirement';

export class DungeonRunStepReq implements Requirement {
	private isCorrectStep = false;

	constructor(private readonly targetStep: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for DungeonRunStepReq', rawReq);
		}
		return new DungeonRunStepReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.isCorrectStep = false;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectStep = false;
	}

	isCompleted(): boolean {
		return this.isCorrectStep;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type !== GameEvent.DUNGEON_RUN_STEP) {
			return;
		}
		if (gameEvent.additionalData.step === this.targetStep) {
			this.isCorrectStep = true;
		}
	}
}
