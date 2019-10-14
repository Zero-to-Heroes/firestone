import { AchievementStatus } from './achievement/achievement-status.type';
import { ReplayInfo } from './replay-info';

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
	readonly replayInfo: readonly ReplayInfo[] = [];

	constructor(
		id: string = null,
		name: string = null,
		type: string = null,
		cardId: string = null,
		cardType: string = null,
		text: string = null,
		completionSteps: CompletionStep[] = null,
		replayInfo: readonly ReplayInfo[] = null,
	) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.cardId = cardId;
		this.cardType = cardType;
		this.text = text;
		this.completionSteps = completionSteps;
		this.replayInfo = replayInfo;
	}

	public achievementStatus(): AchievementStatus {
		if (this.completionSteps.every(step => step.numberOfCompletions > 0)) {
			return 'completed';
		} else if (this.completionSteps.some(step => step.numberOfCompletions > 0)) {
			return 'partially-completed';
		}
		return 'missing';
	}
}

export interface CompletionStep {
	readonly id: string;
	readonly numberOfCompletions: number;
	readonly iconSvgSymbol: string;

	text(showTimes?: boolean): string;
}
