import { Achievement } from './achievement';
import { AchievementSet } from './achievement-set';

export class VisualAchievementCategory {
	public readonly id: string;
	public readonly name: string;
	public readonly icon: string;
	public readonly achievementSets: AchievementSet[];

	public static create(value: VisualAchievementCategory): VisualAchievementCategory {
		return Object.assign(new VisualAchievementCategory(), value);
	}

	public updateAchievement(newAchievement: Achievement): VisualAchievementCategory {
		return Object.assign(new VisualAchievementCategory(), this, {
			achievementSets: this.achievementSets.map(set => set.updateAchievement(newAchievement)),
		} as VisualAchievementCategory);
	}
}
