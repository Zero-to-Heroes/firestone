import { ReplayInfo } from './replay-info';

export class CompletedAchievement {
	readonly id: string;
	readonly numberOfCompletions: number;
	// Most recent is first
	readonly replayInfo: readonly ReplayInfo[] = [];

	constructor(id: string, numberOfCompletions: number, replayInfo: readonly ReplayInfo[]) {
		this.id = id;
		this.numberOfCompletions = numberOfCompletions;
		this.replayInfo = replayInfo;
	}
}
