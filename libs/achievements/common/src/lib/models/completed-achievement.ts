import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class CompletedAchievement {
	readonly id: string | null;
	readonly numberOfCompletions: number | null;

	constructor(id: string | null, numberOfCompletions: number | null) {
		this.id = id;
		this.numberOfCompletions = numberOfCompletions;
	}

	public static create(base: Partial<NonFunctionProperties<CompletedAchievement>>): CompletedAchievement {
		return Object.assign(new CompletedAchievement(null, null), base);
	}

	public update(value: CompletedAchievement): CompletedAchievement {
		return Object.assign(new CompletedAchievement(this.id, this.numberOfCompletions), this, value);
	}
}
