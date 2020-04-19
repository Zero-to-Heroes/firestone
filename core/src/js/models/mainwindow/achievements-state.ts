import { Achievement } from '../achievement';
import { AchievementSet } from '../achievement-set';
import { AchievementHistory } from '../achievement/achievement-history';
import { VisualAchievement } from '../visual-achievement';
import { VisualAchievementCategory } from '../visual-achievement-category';

export class AchievementsState {
	readonly globalCategories: readonly VisualAchievementCategory[] = [];
	// Holds the IDs of all the relevant achievements. The real data is somewhere in the achievements catergories
	readonly achievementHistory: readonly AchievementHistory[] = [];
	readonly isLoading: boolean = true;

	public update(base: AchievementsState): AchievementsState {
		return Object.assign(new AchievementsState(), this, base);
	}

	public updateAchievement(newAchievement: Achievement): AchievementsState {
		return Object.assign(new AchievementsState(), this, {
			globalCategories: this.globalCategories.map(cat =>
				cat.updateAchievement(newAchievement),
			) as readonly VisualAchievementCategory[],
		} as AchievementsState);
	}

	public findAchievementHierarchy(
		achievementId: string,
	): [VisualAchievementCategory, AchievementSet, VisualAchievement] {
		if (!this.globalCategories) {
			return [null, null, null];
		}
		for (const globalCategory of this.globalCategories) {
			for (const achievementSet of globalCategory.achievementSets) {
				for (const achievement of achievementSet.achievements) {
					if (
						achievement.id === achievementId ||
						achievement.completionSteps.some(step => step.id === achievementId)
					) {
						return [globalCategory, achievementSet, achievement];
					}
				}
			}
		}
		return [null, null, null];
	}

	public findAchievements(ids: readonly string[]): readonly VisualAchievement[] {
		return this.globalCategories
			.map(cat => cat.achievementSets)
			.reduce((a, b) => a.concat(b), [])
			.map(set => set.achievements)
			.reduce((a, b) => a.concat(b), [])
			.filter(achv => ids.indexOf(achv.id) !== -1);
	}
}
