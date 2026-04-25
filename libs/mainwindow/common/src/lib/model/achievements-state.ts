import { VisualAchievement, VisualAchievementCategory, retrieveAllAchievements } from '@firestone/achievements/common';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { FilterOption } from './achievement/filter-option';

export class AchievementsState {
	readonly filters: readonly FilterOption[];

	public static create(base: Partial<NonFunctionProperties<AchievementsState>>): AchievementsState {
		return Object.assign(new AchievementsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<AchievementsState>>): AchievementsState {
		return Object.assign(new AchievementsState(), this, base);
	}
}

export const findAchievements = (
	categories: readonly VisualAchievementCategory[],
	ids: readonly string[],
): readonly VisualAchievement[] => {
	if (!ids?.length) {
		return [];
	}

	return retrieveAllAchievements(categories).filter((achv) => ids.indexOf(achv.id) !== -1);
};

export const buildAchievementsFilterOptions = (i18n: ILocalizationService): readonly FilterOption[] => {
	return [
		{
			value: 'ALL_ACHIEVEMENTS',
			label: i18n.translateString('app.achievements.filters.all'),
			emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
			emptyStateTitle: i18n.translateString('app.achievements.filters.all-empty-state-title'),
			emptyStateText: i18n.translateString('app.achievements.filters.all-empty-state-text'),
		},
		{
			value: 'ONLY_MISSING',
			label: i18n.translateString('app.achievements.filters.missing'),
			emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration',
			emptyStateTitle: i18n.translateString('app.achievements.filters.missing-empty-state-title'),
			emptyStateText: i18n.translateString('app.achievements.filters.missing-empty-state-text'),
		},
		{
			value: 'ONLY_COMPLETED',
			label: i18n.translateString('app.achievements.filters.completed'),
			emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
			emptyStateTitle: i18n.translateString('app.achievements.filters.missing-empty-state-title'),
			emptyStateText: i18n.translateString('app.achievements.filters.missing-empty-state-text'),
		},
	];
};
