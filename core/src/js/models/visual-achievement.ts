import { GenericSetProvider } from '../services/achievement/achievement-sets/generic-set-provider';
import { Achievement } from './achievement';
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

	public static create(value: VisualAchievement): VisualAchievement {
		return Object.assign(new VisualAchievement(), value);
	}

	// constructor(
	// 	id: string = null,
	// 	name: string = null,
	// 	type: string = null,
	// 	cardId: string = null,
	// 	cardType: string = null,
	// 	text: string = null,
	// 	completionSteps: CompletionStep[] = null,
	// 	replayInfo: readonly ReplayInfo[] = null,
	// ) {
	// 	this.id = id;
	// 	this.name = name;
	// 	this.type = type;
	// 	this.cardId = cardId;
	// 	this.cardType = cardType;
	// 	this.text = text;
	// 	this.completionSteps = completionSteps;
	// 	this.replayInfo = replayInfo;
	// }

	public update(value: Achievement): VisualAchievement {
		if (value.id !== this.id && this.completionSteps.map(step => step.id).indexOf(value.id) === -1) {
			return this;
		}
		// console.log('[visual-achievement] updating achievement', this, value);
		const completionStepsWithNewCompletions = this.updateCompletionSteps(value);
		const [completionSteps, text] = GenericSetProvider.buildCompletionSteps(
			completionStepsWithNewCompletions,
			value,
			this.text,
		);
		// console.log('[visual-achievement] completionSteps', completionSteps, text);
		return Object.assign(new VisualAchievement(), this, {
			replayInfo: [...value.replayInfo, ...this.replayInfo] as readonly ReplayInfo[],
			completionSteps: completionSteps, //this.updateCompletionSteps(value),
			text: text,
		} as VisualAchievement);
	}

	public achievementStatus(): AchievementStatus {
		if (this.completionSteps.every(step => step.numberOfCompletions > 0)) {
			return 'completed';
		} else if (this.completionSteps.some(step => step.numberOfCompletions > 0)) {
			return 'partially-completed';
		}
		return 'missing';
	}

	private updateCompletionSteps(value: Achievement): readonly CompletionStep[] {
		return this.completionSteps.map(step => {
			if (step.id !== value.id) {
				return step;
			}
			// console.log('[visual-achievement] updating completion step', step, value);
			return Object.assign(step, {
				numberOfCompletions: value.numberOfCompletions,
			} as CompletionStep);
		});
	}
}

export interface CompletionStep {
	readonly id: string;
	readonly numberOfCompletions: number;
	readonly icon: string;
	readonly completedText: string;
	readonly priority: number;

	text(showTimes?: boolean): string;
}
