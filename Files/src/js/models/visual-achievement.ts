import { ReplayInfo } from "./replay-info";
import { text } from "@angular/core/src/render3/instructions";

export class VisualAchievement {

	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly cardId: string;
	readonly cardType: string;
	readonly text: string;
	readonly completionSteps: CompletionStep[];
	// readonly achievementStepIds: string[];
	// readonly numberOfCompletions: number[] = [];
	readonly replayInfo: ReadonlyArray<ReplayInfo> = [];

	constructor(
			id: string = null, 
			name: string = null, 
			type: string = null, 
			cardId: string = null, 
			cardType: string = null,
			text: string = null, 
			completionSteps: CompletionStep[] = null,
			replayInfo: ReadonlyArray<ReplayInfo> = null) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.cardId = cardId;
		this.cardType = cardType;
		this.text = text;
		this.completionSteps = completionSteps;
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

	text(showTimes?: boolean): string;
}