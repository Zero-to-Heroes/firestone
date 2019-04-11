import { VisualAchievement } from './visual-achievement';
import { FilterOption } from './filter-option';

export class AchievementSet {
	readonly id: string;
	readonly displayName: string;
	readonly logoName: string;
	readonly achievements: ReadonlyArray<VisualAchievement> = [];
	readonly filterOptions: ReadonlyArray<FilterOption> = [];

	constructor(
			id: string = null, 
			displayName: string = null, 
			logoName: string = null,
			achievements: ReadonlyArray<VisualAchievement> = null,
			filterOptions: ReadonlyArray<FilterOption> = null) {
		this.id = id;
		this.displayName = displayName;
		this.logoName = logoName;
		this.achievements = achievements;
		this.filterOptions = filterOptions;
	}

	public findAchievementId(achievementId: string): string {
		return this.achievements
				.find((achievement) => achievement.completionSteps.map((step) => step.id).indexOf(achievementId) !== -1)
				.completionSteps[0].id;
	}

	public findAchievement(achievementId: string): VisualAchievement {
		return this.achievements
				.find((achievement) => achievement.completionSteps.map((step) => step.id).indexOf(achievementId) !== -1);
	}

}
