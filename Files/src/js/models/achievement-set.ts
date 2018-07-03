import { CompletedAchievement } from './completed-achievement'

export class AchievementSet {

	id: string;
	achievements: CompletedAchievement[] = [];

	constructor(id: string) {
		this.id = id;
	}
}
