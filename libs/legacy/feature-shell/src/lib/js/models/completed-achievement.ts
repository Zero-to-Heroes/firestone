import { NonFunctionProperties } from '../services/utils';

export class CompletedAchievement {
	readonly id: string;
	readonly numberOfCompletions: number;

	constructor(id: string, numberOfCompletions: number) {
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
