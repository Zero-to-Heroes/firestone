export class AchievementCategory {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly achievementSetIds: string[];

	constructor(id: string, name: string, icon: string, achievementSetIds: string[]) {
		this.id = id;
		this.name = name;
		this.icon = icon;
		this.achievementSetIds = achievementSetIds;
	}
}
