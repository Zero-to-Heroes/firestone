import { AchievementsRepository } from '../services/achievement/achievements-repository.service';
import { Achievement } from './achievement';
import { AchievementStatus } from './achievement/achievement-status.type';

export class VisualAchievement {
	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly cardId: string;
	readonly cardType: string;
	readonly text: string;
	// TODO: make sure the steps are sorted, but I think that's the case already
	readonly completionSteps: readonly CompletionStep[];

	public static create(value: VisualAchievement): VisualAchievement {
		return Object.assign(new VisualAchievement(), value);
	}

	public update(value: Achievement): VisualAchievement {
		if (value.id !== this.id && this.completionSteps.map(step => step.id).indexOf(value.id) === -1) {
			return this;
		}
		// console.debug('[ach] [visual-achievement] updating achievement', this, value);
		const completionStepsWithNewCompletions = this.updateCompletionSteps(value);
		// console.debug(
		// 	'[ach] [visual-achievement] completionStepsWithNewCompletions',
		// 	completionStepsWithNewCompletions,
		// );
		const [completionSteps, text] = AchievementsRepository.buildCompletionSteps(
			completionStepsWithNewCompletions,
			value,
			this.text,
		);
		// console.debug('[ach] [visual-achievement] completionSteps', completionSteps, text);
		return Object.assign(new VisualAchievement(), this, {
			completionSteps: completionSteps, //this.updateCompletionSteps(value),
			text: text,
		} as VisualAchievement);
	}

	public isFullyCompleted(): boolean {
		return this.completionSteps.every(step => step.numberOfCompletions > 0);
	}

	public achievementStatus(): AchievementStatus {
		if (this.completionSteps.every(step => step.numberOfCompletions > 0)) {
			return 'completed';
		} else if (this.completionSteps.some(step => step.numberOfCompletions > 0)) {
			return 'partially-completed';
		}
		return 'missing';
	}

	public getFirstMissingStep(): CompletionStep {
		return this.completionSteps.find(step => !step.numberOfCompletions);
	}

	private updateCompletionSteps(value: Achievement): readonly CompletionStep[] {
		return this.completionSteps.map(step => {
			if (step.id !== value.id) {
				return step;
			}
			// console.log('[visual-achievement] updating completion step', step, value);
			return Object.assign(step, {
				numberOfCompletions: value.numberOfCompletions || step.numberOfCompletions,
				progress: value.progress || step.progress,
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
	// For HS exclusive achievements?
	readonly progress?: number;

	text(showTimes?: boolean): string;
}
