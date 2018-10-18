import { VisualAchievement } from './visual-achievement';
import { FilterOption } from './filter-option';

export class AchievementSet {

	readonly id: string;
	readonly displayName: string;
	readonly logoName: string;
	readonly achievements: ReadonlyArray<VisualAchievement> = [];
	readonly filterOptions: ReadonlyArray<FilterOption> = [];

	constructor(
			id: string, 
			displayName: string, 
			logoName: string,
			achievements: ReadonlyArray<VisualAchievement>,
			filterOptions: ReadonlyArray<FilterOption>) {
		this.id = id;
		this.displayName = displayName;
		this.logoName = logoName;
		this.achievements = achievements;
		this.filterOptions = filterOptions;
	}
}
