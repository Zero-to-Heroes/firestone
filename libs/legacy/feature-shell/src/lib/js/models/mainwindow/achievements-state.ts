import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { AchievementHistory } from '../achievement/achievement-history';
import { FilterOption } from '../filter-option';
import { VisualAchievement } from '../visual-achievement';
import { VisualAchievementCategory } from '../visual-achievement-category';

export class AchievementsState {
	readonly filters: readonly FilterOption[];
	// readonly categories: readonly VisualAchievementCategory[] = [];
	// Holds the IDs of all the relevant achievements. The real data is somewhere in the achievements catergories
	readonly achievementHistory: readonly AchievementHistory[] = [];
	readonly isLoading: boolean = true;

	public update(base: Partial<NonFunctionProperties<AchievementsState>>): AchievementsState {
		return Object.assign(new AchievementsState(), this, base);
	}

	public static buildFilterOptions(i18n: LocalizationFacadeService): readonly FilterOption[] {
		return [
			{
				value: 'ALL_ACHIEVEMENTS',
				label: i18n.translateString('app.achievements.filters.all'),
				filterFunction: (a) => true,
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: i18n.translateString('app.achievements.filters.all-empty-state-title'),
				emptyStateText: i18n.translateString('app.achievements.filters.all-empty-state-text'),
			},
			{
				value: 'ONLY_MISSING',
				label: i18n.translateString('app.achievements.filters.missing'),
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.some((step) => step.numberOfCompletions === 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration',
				emptyStateTitle: i18n.translateString('app.achievements.filters.missing-empty-state-title'),
				emptyStateText: i18n.translateString('app.achievements.filters.missing-empty-state-text'),
			},
			{
				value: 'ONLY_COMPLETED',
				label: i18n.translateString('app.achievements.filters.completed'),
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.every((step) => step.numberOfCompletions > 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: i18n.translateString('app.achievements.filters.missing-empty-state-title'),
				emptyStateText: i18n.translateString('app.achievements.filters.missing-empty-state-text'),
			},
		];
	}
}

export const findAchievements = (
	categories: readonly VisualAchievementCategory[],
	ids: readonly string[],
): readonly VisualAchievement[] => {
	if (!ids?.length) {
		return [];
	}

	return [...categories.map((cat) => cat.retrieveAllAchievements()).reduce((a, b) => a.concat(b), [])].filter(
		(achv) => ids.indexOf(achv.id) !== -1,
	);
};
