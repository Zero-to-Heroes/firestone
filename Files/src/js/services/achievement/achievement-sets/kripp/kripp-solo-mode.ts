import { SetProvider, IndexedVisualAchievement } from '../set-provider';
import { AllCardsService } from '../../../all-cards.service';
import { AchievementConfService } from '../../achievement-conf.service';
import { Achievement } from '../../../../models/achievement';
import { CompletedAchievement } from '../../../../models/completed-achievement';
import { AchievementSet } from '../../../../models/achievement-set';
import { FilterOption } from '../../../../models/filter-option';
import { VisualAchievement, CompletionStep } from '../../../../models/visual-achievement';

export class KrippSoloModeSetProvider extends SetProvider {
	private cardsService: AllCardsService;
	private logoName: string;
	private conf: AchievementConfService;

	constructor(cardsService: AllCardsService, conf: AchievementConfService) {
		super('kripp_achievements_1_solo_mode', 'Solo Mode', [
			'kripp_achievements_1_treasure_room',
			'kripp_achievements_1_rod_of_roasting',
			'kripp_achievements_1_arcane_missiles',
		]);
		this.logoName = 'kripp_achievements_1_solo_mode';
		this.cardsService = cardsService;
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
		const text = achievement.text;
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
				achievement.cardId,
				achievement.cardType,
				text,
				completionSteps,
				replayInfo,
			),
			index: index,
		};
	}

	protected isAchievementVisualRoot(achievement: Achievement): boolean {
		return this.types.indexOf(achievement.type) !== -1;
	}
}
