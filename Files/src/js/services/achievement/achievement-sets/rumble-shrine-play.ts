import { Achievement } from '../../../models/achievement';
import { AchievementSet } from '../../../models/achievement-set';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { FilterOption } from '../../../models/filter-option';
import { CompletionStep, VisualAchievement } from '../../../models/visual-achievement';
import { AchievementConfService } from '../achievement-conf.service';
import { IndexedVisualAchievement, SetProvider } from './set-provider';

export class RumbleRunShrinePlaySetProvider extends SetProvider {
	private logoName: string;
	private conf: AchievementConfService;

	constructor(conf: AchievementConfService) {
		super('rumble_run_shrine_play', 'Shrines played', ['rumble_run_shrine_play']);
		this.logoName = 'achievements_shrine';
		this.conf = conf;
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
				value: 'ONLY_COMPLETED',
				label: 'Completed achievements',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps[0].numberOfCompletions > 0;
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Tons of achievements await you!',
				emptyStateText: 'Find them listed here once completed.',
			},
		];
	}

	protected convertToVisual(achievement: Achievement, index: number): IndexedVisualAchievement {
		const cardText = achievement.text || '...';
		const text = cardText
			.replace('<i>', '')
			.replace('</i>', '')
			.replace('[x]', '');
		const replayInfo = [...(achievement.replayInfo || [])].sort((a, b) => a.creationTimestamp - b.creationTimestamp);
		const completionSteps = [
			{
				id: achievement.id,
				numberOfCompletions: achievement.numberOfCompletions,
				iconSvgSymbol: this.conf.icon(achievement.type),
				text(showTimes: boolean = false): string {
					const times = showTimes ? `${achievement.numberOfCompletions} times` : ``;
					return `You played ${achievement.name} ${times}`;
				},
			} as CompletionStep,
		];
		return {
			achievement: new VisualAchievement(
				achievement.id,
				achievement.name,
				this.id,
				achievement.displayCardId,
				achievement.displayCardType,
				text,
				completionSteps,
				replayInfo,
			),
			index: index,
		};
	}

	protected isAchievementVisualRoot(achievement: Achievement): boolean {
		return achievement.type === this.types[0];
	}
}
