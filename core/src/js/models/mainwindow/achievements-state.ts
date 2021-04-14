import { Achievement } from '../achievement';
import { AchievementHistory } from '../achievement/achievement-history';
import { VisualAchievement } from '../visual-achievement';
import { VisualAchievementCategory } from '../visual-achievement-category';

export class AchievementsState {
	readonly categories: readonly VisualAchievementCategory[] = [];
	// Holds the IDs of all the relevant achievements. The real data is somewhere in the achievements catergories
	readonly achievementHistory: readonly AchievementHistory[] = [];
	readonly isLoading: boolean = true;

	public update(base: AchievementsState): AchievementsState {
		return Object.assign(new AchievementsState(), this, base);
	}

	public updateAchievement(newAchievement: Achievement): AchievementsState {
		return Object.assign(new AchievementsState(), this, {
			categories: this.categories.map(cat =>
				cat.updateAchievement(newAchievement),
			) as readonly VisualAchievementCategory[],
		} as AchievementsState);
	}

	public findCategory(categoryId: string): VisualAchievementCategory {
		return this.categories.map(cat => cat.findCategory(categoryId)).filter(cat => cat)[0];
	}

	public findAchievementHierarchy(achievementId: string): [VisualAchievementCategory[], VisualAchievement] {
		if (!this.categories) {
			return [null, null];
		}

		return this.categories
			.map(cat => cat.findAchievementHierarchy(achievementId))
			.find(result => result.length === 2 && result[1]);
	}

	public findCategoryHierarchy(categoryId: string): VisualAchievementCategory[] {
		if (!this.categories) {
			return null;
		}

		return this.categories
			.map(cat => cat.findCategoryHierarchy(categoryId))
			.filter(cat => cat)
			.find(result => result.length > 0);
	}

	public findAchievements(ids: readonly string[]): readonly VisualAchievement[] {
		if (!ids?.length) {
			return [];
		}

		return this.retrieveAllAchievements().filter(achv => ids.indexOf(achv.id) !== -1);
	}

	public retrieveAllAchievements(): readonly VisualAchievement[] {
		return [...this.categories.map(cat => cat.retrieveAllAchievements()).reduce((a, b) => a.concat(b), [])];
	}
}
