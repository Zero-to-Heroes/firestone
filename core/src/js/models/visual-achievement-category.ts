import { Achievement } from './achievement';
import { VisualAchievement } from './visual-achievement';

export class VisualAchievementCategory {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly categories: readonly VisualAchievementCategory[] = [];
	readonly achievements: readonly VisualAchievement[] = [];
	// readonly filterOptions: readonly FilterOption[] = [];

	public static create(value: VisualAchievementCategory): VisualAchievementCategory {
		return Object.assign(new VisualAchievementCategory(), value);
	}

	public findCategory(categoryId: string): VisualAchievementCategory {
		if (categoryId === this.id) {
			return this;
		}
		const matches = this.categories.map(cat => cat.findCategory(categoryId)).filter(cat => cat);
		// console.log('matches', matches);
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
			.map(cat => cat.findCategoryHierarchy(categoryId))
			.filter(cat => cat)
			.find(result => result.length > 0 && result[result.length - 1] != null);
		if (!subHierarchy) {
			return [];
		}

		return [this, ...subHierarchy].filter(cat => cat);
	}

	public findAchievementHierarchy(achievementId: string): [VisualAchievementCategory[], VisualAchievement] {
		const achievement = this.achievements.find(
			ach => ach.id === achievementId || ach.completionSteps.some(step => step.id === achievementId),
		);
		//console.log('[debug] looking for achievement', achievementId, achievement, this);
		if (achievement) {
			//console.log('[debug] found it!!!!!!!!!!!!!!!!!!', achievementId, achievement, this);
			return [[this], achievement];
		}

		const subHierarchy = this.categories
			.map(cat => cat.findAchievementHierarchy(achievementId))
			.find(result => result.length === 2 && result[1]);
		//console.log('[debug] sub hierarchy', achievementId, achievement, subHierarchy, this);
		if (!subHierarchy) {
			return [[this], null];
		}

		return [[this, ...subHierarchy[0]], subHierarchy[1]];
	}

	public updateAchievement(newAchievement: Achievement): VisualAchievementCategory {
		// Owned by this category
		if (
			this.achievements.find(
				ach => ach.id === newAchievement.id || ach.completionSteps.some(step => step.id === newAchievement.id),
			)
		) {
			return Object.assign(new VisualAchievementCategory(), this, {
				achievements: this.achievements.map(ach => ach.update(newAchievement)) as readonly VisualAchievement[],
			} as VisualAchievementCategory);
		}
		// Owned by a category below
		return Object.assign(new VisualAchievementCategory(), this, {
			categories: this.categories.map(cat =>
				cat.updateAchievement(newAchievement),
			) as readonly VisualAchievementCategory[],
		} as VisualAchievementCategory);
	}

	public retrieveAllAchievements(): readonly VisualAchievement[] {
		return [
			...this.achievements,
			...this.categories.map(cat => cat.retrieveAllAchievements()).reduce((a, b) => a.concat(b), []),
		];
	}
}
