import { VisualAchievement } from '../models/visual-achievement';
import { VisualAchievementCategory } from '../models/visual-achievement-category';

/** Category-like shape (class instance or plain object from IPC). */
type CategoryLike = {
	id: string;
	categories?: readonly CategoryLike[] | readonly VisualAchievementCategory[];
	achievements?: readonly VisualAchievement[] | readonly unknown[];
};

function findCategoryRec(
	id: string,
	categories: readonly CategoryLike[] | undefined,
): VisualAchievementCategory | CategoryLike | null | undefined {
	if (!categories?.length || !id) {
		return null;
	}
	for (const cat of categories) {
		if (cat.id === id) {
			return cat as VisualAchievementCategory;
		}
		const found = findCategoryRec(id, cat.categories ?? []);
		if (found) {
			return found as VisualAchievementCategory;
		}
	}
	return null;
}

function findCategoryHierarchyRec(
	id: string,
	categories: readonly CategoryLike[] | undefined,
	path: VisualAchievementCategory[] | CategoryLike[] = [],
): VisualAchievementCategory[] | CategoryLike[] | undefined {
	if (!id || !categories?.length) {
		return undefined;
	}
	for (const cat of categories) {
		if (cat.id === id) {
			return [...path, cat];
		}
		const sub = findCategoryHierarchyRec(id, cat.categories ?? [], [...path, cat]);
		if (sub?.length) {
			return sub;
		}
	}
	return undefined;
}

function findAchievementHierarchyRec(
	achievementId: string | number,
	categories: readonly CategoryLike[] | undefined,
): { categories: (VisualAchievementCategory | CategoryLike)[]; achievement: VisualAchievement | null } | null {
	if (!categories?.length) {
		return null;
	}
	for (const cat of categories) {
		const achievements = (cat as CategoryLike).achievements ?? [];
		const achievement = (achievements as readonly VisualAchievement[]).find(
			(ach) =>
				ach.id === achievementId ||
				ach.hsAchievementId === achievementId ||
				(ach.completionSteps?.some(
					(step) => step.id === String(achievementId) || step.hsAchievementId === achievementId,
				) ??
					false),
		);
		if (achievement) {
			return { categories: [cat], achievement };
		}
		const sub = findAchievementHierarchyRec(achievementId, cat.categories ?? []);
		if (sub?.achievement) {
			return { categories: [cat, ...sub.categories], achievement: sub.achievement };
		}
	}
	return null;
}

function retrieveAllAchievementsRec(categories: readonly CategoryLike[] | undefined): readonly VisualAchievement[] {
	if (!categories?.length) {
		return [];
	}
	return categories.flatMap((cat) => {
		const direct = (cat.achievements ?? []) as readonly VisualAchievement[];
		const nested = retrieveAllAchievementsRec(cat.categories ?? []);
		return [...direct, ...nested];
	});
}

export const buildAchievementHierarchy = (
	achievementId: string | number,
	categories: readonly VisualAchievementCategory[],
):
	| {
			categories: VisualAchievementCategory[];
			achievement: VisualAchievement | null;
	  }
	| null
	| undefined => {
	const result = findAchievementHierarchyRec(achievementId, categories as readonly CategoryLike[]);
	return result as (typeof result & { categories: VisualAchievementCategory[] }) | null | undefined;
};

export const builCategoryHierarchy = (
	categoryId: string,
	categories: readonly VisualAchievementCategory[],
):
	| {
			categories: VisualAchievementCategory[];
	  }
	| null
	| undefined => {
	if (!categories?.length) {
		return null;
	}
	const id = categoryId?.split('/')?.pop();
	const hierarchy = findCategoryHierarchyRec(id ?? categoryId, categories as readonly CategoryLike[]);
	return hierarchy?.length ? { categories: hierarchy as VisualAchievementCategory[] } : { categories: [] };
};

export const findCategory = (
	categoryId: string,
	categories: readonly VisualAchievementCategory[],
): VisualAchievementCategory | null | undefined => {
	if (!categories?.length) {
		return null;
	}
	const id = categoryId?.split('/')?.pop() ?? categoryId;
	return findCategoryRec(id, categories as readonly CategoryLike[]) as VisualAchievementCategory | null | undefined;
};

export const retrieveAllAchievements = (
	categories: readonly VisualAchievementCategory[],
): readonly VisualAchievement[] => {
	return retrieveAllAchievementsRec(categories as readonly CategoryLike[]) as readonly VisualAchievement[];
};
