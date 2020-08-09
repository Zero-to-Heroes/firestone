import { Achievement } from '../../../models/achievement';
import { AchievementSet } from '../../../models/achievement-set';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { FilterOption } from '../../../models/filter-option';
import { ReplayInfo } from '../../../models/replay-info';
import { CompletionStep, VisualAchievement } from '../../../models/visual-achievement';
import { IndexedVisualAchievement, SetProvider } from './set-provider';

// The idea is that everything should be driven now by the achievement data itself
// so the only need for specific sets is to handle the grouping
export abstract class GenericSetProvider extends SetProvider {
	protected logoName: string;

	constructor(id: string, displayName: string, types: string[], logoName: string) {
		super(id, displayName, types);
		this.logoName = logoName;
	}

	// Used only for display
	public provide(allAchievements: Achievement[], completedAchievemnts?: CompletedAchievement[]): AchievementSet {
		const fullAchievements = this.visualAchievements(allAchievements, completedAchievemnts);
		const filterOptions: readonly FilterOption[] = this.filterOptions();
		return AchievementSet.create({
			id: this.id,
			displayName: this.displayName,
			logoName: this.logoName,
			achievements: fullAchievements,
			filterOptions: filterOptions,
		} as AchievementSet);
	}

	protected filterOptions(): readonly FilterOption[] {
		return [
			{
				value: 'ALL_ACHIEVEMENTS',
				label: 'All achievements',
				filterFunction: a => true,
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Holy Moly, you are epic!',
				emptyStateText: '100% of achievements in this category complete.',
			},
			{
				value: 'ONLY_MISSING',
				label: 'Incomplete achievements',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.some(step => step.numberOfCompletions === 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration',
				emptyStateTitle: 'Tons of achievements are awaiting you!',
				emptyStateText: 'Find them listed here once completed.',
			},
			{
				value: 'ONLY_COMPLETED',
				label: 'Completed achievements',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.every(step => step.numberOfCompletions > 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Tons of achievements are awaiting you!',
				emptyStateText: 'Find them listed here once completed.',
			},
		];
	}

	protected convertToVisual(
		achievement: Achievement,
		index: number,
		allAchievements: Achievement[],
	): IndexedVisualAchievement {
		const achievementForCompletionSteps: Achievement[] = allAchievements
			.filter(achv => achv.type === achievement.type)
			.sort((a, b) => a.priority - b.priority);
		let text = achievement.text || achievement.emptyText;
		const [completionSteps, textFromStep] = GenericSetProvider.buildCompletionSteps(
			achievementForCompletionSteps,
			achievement,
			text,
		);
		text = text || textFromStep;
		let replayInfo = [];
		for (let i = 0; i < achievementForCompletionSteps.length; i++) {
			replayInfo = [...(achievementForCompletionSteps[i].replayInfo || []), ...replayInfo];
		}
		replayInfo = replayInfo.sort((a, b) => a.creationTimestamp - b.creationTimestamp);
		return {
			achievement: VisualAchievement.create({
				id: achievement.id,
				name: achievement.name,
				type: this.id,
				cardId: achievement.displayCardId,
				cardType: achievement.displayCardType,
				text: text,
				completionSteps: completionSteps,
				replayInfo: replayInfo as readonly ReplayInfo[],
			} as VisualAchievement),
			index: index,
		};
	}

	public static buildCompletionSteps(
		achievementForCompletionSteps: readonly (Achievement | CompletionStep)[],
		achievement: Achievement,
		text: string,
	): [readonly CompletionStep[], string] {
		const areProgressionSteps =
			achievementForCompletionSteps
				.map(achv => achv.priority)
				.filter((value, index, self) => self.indexOf(value) === index).length !== 1;
		// console.log('[completion-steps] areProgressionSteps', areProgressionSteps);
		const invertedCompletionSteps = [];
		let alreadyDefinedText = achievement.text || false;
		// Useful to make sure we have some consistency in the number of comletions
		let maxNumberOfCompletions = 0;
		for (let i = achievementForCompletionSteps.length - 1; i >= 0; i--) {
			const achv = achievementForCompletionSteps[i];
			// console.log('[completion-steps] handling step', achv);
			const completions: number = areProgressionSteps
				? Math.max(maxNumberOfCompletions, achv.numberOfCompletions)
				: achv.numberOfCompletions;
			// console.log('[completion-steps] completions', completions);
			maxNumberOfCompletions = completions;
			if (completions > 0 && !alreadyDefinedText) {
				text = achv.completedText;
				alreadyDefinedText = true;
			}
			invertedCompletionSteps.push({
				id: `${achv.id}`,
				numberOfCompletions: areProgressionSteps ? completions : achv.numberOfCompletions,
				icon: achv.icon,
				completedText: achv.completedText,
				priority: achv.priority,
				text(showTimes = false): string {
					const times = ``;
					return `${achv.completedText} <span class="number-of-times">${times}</span>`;
				},
			} as CompletionStep);
		}
		// console.log('[completion-steps] invertedCompletionSteps', invertedCompletionSteps);
		return [invertedCompletionSteps.reverse() as readonly CompletionStep[], text];
	}

	protected isAchievementVisualRoot(achievement: Achievement): boolean {
		return achievement.root;
	}
}
