import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Achievement } from '../achievement';
import { AchievementHistory } from '../achievement/achievement-history';
import { FilterOption } from '../filter-option';
import { VisualAchievement } from '../visual-achievement';
import { VisualAchievementCategory } from '../visual-achievement-category';

export class AchievementsState {
	readonly filters: readonly FilterOption[];
	readonly categories: readonly VisualAchievementCategory[] = [];
	// Holds the IDs of all the relevant achievements. The real data is somewhere in the achievements catergories
	readonly achievementHistory: readonly AchievementHistory[] = [];
	readonly isLoading: boolean = true;

	public update(base: AchievementsState): AchievementsState {
		return Object.assign(new AchievementsState(), this, base);
	}

	public updateAchievement(newAchievement: Achievement, categoryId?: string): AchievementsState {
		return Object.assign(new AchievementsState(), this, {
			categories: this.categories.map((cat) =>
				categoryId && cat.id !== categoryId ? cat : cat.updateAchievement(newAchievement),
			) as readonly VisualAchievementCategory[],
		} as AchievementsState);
	}

	/* @deprecated because it forces us to keep a refrence to the state, wihch reduces the efficiency of distinctUntilChanged */
	public findCategory(categoryId: string): VisualAchievementCategory {
		return this.categories.map((cat) => cat.findCategory(categoryId)).filter((cat) => cat)[0];
	}

	/* @deprecated because it forces us to keep a refrence to the state, wihch reduces the efficiency of distinctUntilChanged */
	public findAchievementHierarchy(achievementId: string): [VisualAchievementCategory[], VisualAchievement] {
		if (!this.categories) {
			return [null, null];
		}

		return this.categories
			.map((cat) => cat.findAchievementHierarchy(achievementId))
			.find((result) => result.length === 2 && result[1]);
	}

	/* @deprecated because it forces us to keep a refrence to the state, wihch reduces the efficiency of distinctUntilChanged */
	public findCategoryHierarchy(categoryId: string): VisualAchievementCategory[] {
		if (!this.categories) {
			return null;
		}

		return this.categories
			.map((cat) => cat.findCategoryHierarchy(categoryId))
			.filter((cat) => cat)
			.find((result) => result.length > 0);
	}

	/* @deprecated because it forces us to keep a refrence to the state, wihch reduces the efficiency of distinctUntilChanged */
	public findAchievements(ids: readonly string[]): readonly VisualAchievement[] {
		if (!ids?.length) {
			return [];
		}

		return this.retrieveAllAchievements().filter((achv) => ids.indexOf(achv.id) !== -1);
	}

	/* @deprecated because it forces us to keep a refrence to the state, wihch reduces the efficiency of distinctUntilChanged */
	public retrieveAllAchievements(): readonly VisualAchievement[] {
		return [...this.categories.map((cat) => cat.retrieveAllAchievements()).reduce((a, b) => a.concat(b), [])];
	}

	public static buildFilterOptions(i18n: LocalizationFacadeService): readonly FilterOption[] {
		return [
			{
				value: 'ALL_ACHIEVEMENTS',
				label: i18n.translateString('all.achievements.filters.all'),
				filterFunction: (a) => true,
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: i18n.translateString('all.achievements.filters.all-empty-state-title'),
				emptyStateText: i18n.translateString('all.achievements.filters.all-empty-state-text'),
			},
			{
				value: 'ONLY_MISSING',
				label: i18n.translateString('all.achievements.filters.missing'),
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.some((step) => step.numberOfCompletions === 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration',
				emptyStateTitle: i18n.translateString('all.achievements.filters.missing-empty-state-title'),
				emptyStateText: i18n.translateString('all.achievements.filters.missing-empty-state-text'),
			},
			{
				value: 'ONLY_COMPLETED',
				label: i18n.translateString('all.achievements.filters.completed'),
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.every((step) => step.numberOfCompletions > 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: i18n.translateString('all.achievements.filters.missing-empty-state-title'),
				emptyStateText: i18n.translateString('all.achievements.filters.missing-empty-state-text'),
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
