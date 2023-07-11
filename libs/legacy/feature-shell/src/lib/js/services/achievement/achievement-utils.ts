import { VisualAchievement } from '../../models/visual-achievement';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';

export const buildAchievementHierarchy = (
	achievementId: string | number,
	categories: readonly VisualAchievementCategory[],
): {
	categories: VisualAchievementCategory[];
	achievement: VisualAchievement;
} => {
	if (!categories?.length) {
		return null;
	}

	return categories.map((cat) => cat.findAchievementHierarchy(achievementId)).find((result) => !!result.achievement);
};

export const builCategoryHierarchy = (
	categoryId: string,
	categories: readonly VisualAchievementCategory[],
): {
	categories: VisualAchievementCategory[];
} => {
	if (!categories?.length) {
		return null;
	}

	return {
		categories: categories
			.map((cat) => cat.findCategoryHierarchy(categoryId))
			.filter((cat) => cat)
			.find((result) => result.length > 0),
	};
};

export const findCategory = (
	categoryId: string,
	categories: readonly VisualAchievementCategory[],
): VisualAchievementCategory => {
	if (!categories?.length) {
		return null;
	}

	const matches = categories.map((cat) => cat.findCategory(categoryId)).filter((cat) => cat);
	return matches.length > 0 ? matches[0] : null;
};

export const retrieveAllAchievements = (
	categories: readonly VisualAchievementCategory[],
): readonly VisualAchievement[] => {
	if (!categories?.length) {
		return [];
	}

	return categories.map((cat) => cat.retrieveAllAchievements()).reduce((a, b) => a.concat(b), []);
};
