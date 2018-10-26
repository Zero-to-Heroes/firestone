import { ReplayInfo } from "./replay-info";

export class CompletedAchievement {

	readonly id: string;
	readonly numberOfCompletions: number = 0;
	// Most recent is first
	readonly replayInfo: ReadonlyArray<ReplayInfo> = [];

	constructor(id: string, numberOfCompletions?: number, replayInfo?: ReadonlyArray<ReplayInfo>) {
		this.id = id;
		this.numberOfCompletions = numberOfCompletions || 0;
		this.replayInfo = replayInfo;
	}

}
