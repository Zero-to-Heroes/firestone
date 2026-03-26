import { RawRequirement } from '@firestone/achievements/common';
import { GameEvent } from '@firestone/game-state';
import { Requirement } from './_requirement';

export class MinionsControlledDuringTurnReq implements Requirement {
	private numberOfMinions: number;

	constructor(
		private readonly minionCardId: string,
		private readonly targetNumberOfMinions: number,
		private readonly qualifier: string,
	) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for MinionsControlledDuringTurnReq', rawReq);
		}
		return new MinionsControlledDuringTurnReq(rawReq.values[0], parseInt(rawReq.values[1]), rawReq.values[2]);
	}

	reset(): void {
		this.numberOfMinions = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.numberOfMinions = undefined;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.numberOfMinions >= this.targetNumberOfMinions;
		}
		return this.numberOfMinions === this.targetNumberOfMinions;
	}

	test(_gameEvent: GameEvent): void {}
}
