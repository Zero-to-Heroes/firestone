import { Achievement } from '../../../models/achievement';
import { AchievementSet } from '../../../models/achievement-set';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { FilterOption } from '../../../models/filter-option';
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
		return new AchievementSet(this.id, this.displayName, this.logoName, fullAchievements, filterOptions);
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
				label: 'Locked achievements',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.map(step => step.numberOfCompletions).reduce((a, b) => a + b, 0) === 0;
				},
				emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration',
				emptyStateTitle: 'Tons of achievements await you!',
				emptyStateText: 'Find them listed here once completed.',
			},
			{
				value: 'ONLY_PARTIALLY_COMPLETED',
				label: 'Partial achievements',
				filterFunction: (a: VisualAchievement) => {
					return (
						a.completionSteps.some(step => step.numberOfCompletions > 0) &&
						!a.completionSteps.every(step => step.numberOfCompletions > 0)
					);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Tons of achievements await you!',
				emptyStateText: 'Find them listed here once completed.',
			},
			{
				value: 'ONLY_COMPLETED',
				label: 'Completed achievements',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.every(step => step.numberOfCompletions > 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Tons of achievements await you!',
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
		let alreadyDefinedText = achievement.text || false;
		// Useful to make sure we have some consistency in the number of comletions
		let maxNumberOfCompletions = 0;
		const invertedCompletionSteps = [];
		for (let i = achievementForCompletionSteps.length - 1; i >= 0; i--) {
			const achv = achievementForCompletionSteps[i];
			const completions: number = Math.max(maxNumberOfCompletions, achv.numberOfCompletions);
			maxNumberOfCompletions = completions;
			if (completions > 0 && !alreadyDefinedText) {
				text = achv.completedText;
				alreadyDefinedText = true;
			}
			invertedCompletionSteps.push({
				id: `${achv.id}`,
				numberOfCompletions: completions,
				iconSvgSymbol: achv.icon,
				text(showTimes: boolean = false): string {
					const times = showTimes ? `${completions} times` : ``;
					return `${achv.completedText} <span class="number-of-times">${times}</span>`;
				},
			} as CompletionStep);
		}
		let replayInfo = [];
		for (let i = 0; i < achievementForCompletionSteps.length; i++) {
			replayInfo = [...(achievementForCompletionSteps[i].replayInfo || []), ...replayInfo];
		}
		replayInfo = replayInfo.sort((a, b) => a.creationTimestamp - b.creationTimestamp);
		return {
			achievement: new VisualAchievement(
				achievement.id,
				achievement.name,
				this.id,
				achievement.displayCardId,
				achievement.displayCardType,
				text,
				invertedCompletionSteps.reverse(),
				replayInfo,
			),
			index: index,
		};
	}

	protected isAchievementVisualRoot(achievement: Achievement): boolean {
		return achievement.root;
	}
}
