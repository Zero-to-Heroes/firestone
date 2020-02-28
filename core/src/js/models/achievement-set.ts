import { Achievement } from './achievement';
import { FilterOption } from './filter-option';
import { VisualAchievement } from './visual-achievement';

export class AchievementSet {
	readonly id: string;
	readonly displayName: string;
	readonly logoName: string;
	readonly achievements: readonly VisualAchievement[] = [];
	readonly filterOptions: readonly FilterOption[] = [];

	public static create(value: AchievementSet): AchievementSet {
		const sortedAchievements = AchievementSet.sort(value.achievements);
		return Object.assign(new AchievementSet(), value, {
			achievements: sortedAchievements,
		} as AchievementSet);
	}

	public updateAchievement(newAchievement: Achievement): AchievementSet {
		return Object.assign(new AchievementSet(), this, {
			achievements: AchievementSet.sort(this.achievements.map(ach =>
				ach.update(newAchievement),
			) as readonly VisualAchievement[]),
		} as AchievementSet);
	}

	public findAchievementId(achievementId: string): string {
		return this.achievements.find(
			achievement => achievement.completionSteps.map(step => step.id).indexOf(achievementId) !== -1,
		).completionSteps[0].id;
	}

	public findAchievement(achievementId: string): VisualAchievement {
		return this.achievements.find(
			achievement => achievement.completionSteps.map(step => step.id).indexOf(achievementId) !== -1,
		);
	}

	private static sort(achievements: readonly VisualAchievement[]): readonly VisualAchievement[] {
		return [...achievements]
			.map((achievement, index) => ({
				achievement,
				index,
			}))
			.sort((a, b) => {
				const aVisibility = AchievementSet.sortPriority(a.achievement);
				const bVisibility = AchievementSet.sortPriority(b.achievement);
				return bVisibility - aVisibility || a.index - b.index;
			})
			.map(a => a.achievement);
	}

	private static sortPriority(achievement: VisualAchievement): number {
		const numberOfSteps = achievement.completionSteps.length;
		for (let i = numberOfSteps; i > 0; i--) {
			if (achievement.completionSteps[i - 1].numberOfCompletions > 0) {
				return i;
			}
		}
		return 0;
	}
}

interface IndexedVisualAchievement {
	achievement: VisualAchievement;
	index: number;
}
