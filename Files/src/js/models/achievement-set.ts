import { CompletedAchievement } from './completed-achievement'

export class AchievementSetOld {

	id: string;
	achievements: CompletedAchievement[] = [];

	constructor(id: string) {
		this.id = id;
	}
}
