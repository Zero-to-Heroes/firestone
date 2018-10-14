import { Achievement } from './achievement'
import { VisualAchievement } from './visual-achievement';

export class AchievementSet {

	readonly id: string;
	readonly displayName: string;
	readonly achievements: ReadonlyArray<VisualAchievement> = [];

	constructor(id: string, displayName: string, achievements: ReadonlyArray<VisualAchievement>) {
		this.id = id;
		this.displayName = displayName;
		this.achievements = achievements;
	}
}
