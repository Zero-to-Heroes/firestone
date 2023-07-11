import { VisualAchievement } from './visual-achievement';

export class VisualAchievementCategory {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly categories: readonly VisualAchievementCategory[] = [];
	readonly achievements: readonly VisualAchievement[] = [];

	public static create(value: VisualAchievementCategory): VisualAchievementCategory {
		return Object.assign(new VisualAchievementCategory(), value);
	}

	public findCategory(categoryId: string): VisualAchievementCategory {
		if (!categoryId) {
			return null;
		}
		if (categoryId === this.id) {
			return this;
		}
		const matches = this.categories.map((cat) => cat.findCategory(categoryId)).filter((cat) => cat);
		return matches.length > 0 ? matches[0] : null;
	}

	public findCategoryHierarchy(categoryId: string): VisualAchievementCategory[] {
		if (this.id === categoryId) {
			return [this];
		}

		if (this.categories.length === 0) {
			return [];
		}

		const subHierarchy = this.categories
			.map((cat) => cat.findCategoryHierarchy(categoryId))
			.filter((cat) => cat)
			.find((result) => result.length > 0 && result[result.length - 1] != null);
		if (!subHierarchy) {
			return [];
		}

		return [this, ...subHierarchy].filter((cat) => cat);
	}

	public findAchievementHierarchy(achievementId: string | number): {
		categories: VisualAchievementCategory[];
		achievement: VisualAchievement;
	} {
		const achievement = this.achievements.find(
			(ach) =>
				ach.id === achievementId ||
				ach.hsAchievementId === achievementId ||
				ach.completionSteps.some((step) => step.id === achievementId || step.hsAchievementId === achievementId),
		);
		if (achievement) {
			return {
				categories: [this],
				achievement: achievement,
			};
		}

		const subHierarchy = this.categories
			.map((cat) => cat.findAchievementHierarchy(achievementId))
			.find((result) => result.achievement != null);
		if (!subHierarchy) {
			return {
				categories: [this],
				achievement: null,
			};
		}

		return {
			categories: [this, ...subHierarchy.categories],
			achievement: subHierarchy.achievement,
		};
	}

	public retrieveAllAchievements(): readonly VisualAchievement[] {
		return [
			...this.achievements,
			...this.categories.map((cat) => cat.retrieveAllAchievements()).reduce((a, b) => a.concat(b), []),
		];
	}
}
