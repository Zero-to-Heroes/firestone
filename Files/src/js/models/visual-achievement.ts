import { ReplayInfo } from "./replay-info";
import { text } from "@angular/core/src/render3/instructions";

export class VisualAchievement {

	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly cardId: string;
	readonly text: string;
	readonly completionSteps: CompletionStep[];
	// readonly achievementStepIds: string[];
	// readonly numberOfCompletions: number[] = [];
	readonly replayInfo: ReadonlyArray<ReplayInfo> = [];

	constructor(
			id: string, 
			name: string, 
			type: string, 
			cardId: string, 
			text: string, 
			completionSteps: CompletionStep[],
			// achievementStepIds: string[], 
			// numberOfCompletions: number[] = [],
			replayInfo: ReadonlyArray<ReplayInfo>) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.cardId = cardId;
		this.text = text;
		this.completionSteps = completionSteps;
		// this.achievementStepIds = achievementStepIds;
		// this.numberOfCompletions = numberOfCompletions;
		this.replayInfo = replayInfo;
	}

	public isAchieved(): boolean {
		const totalAchieved = this.completionSteps
				.map((step) => step.numberOfCompletions)
				.reduce((a, b) => a + b, 0);
		return totalAchieved > 0;
	}
}

export interface CompletionStep {
	readonly id: string;
	readonly numberOfCompletions: number;
	readonly iconSvgSymbol: string;

	text(): string;
}