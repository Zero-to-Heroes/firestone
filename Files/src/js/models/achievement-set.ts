import { Achievement } from './achievement'

export class AchievementSet {

	readonly id: string;
	readonly displayName: string;
	readonly achievements: ReadonlyArray<Achievement> = [];

	constructor(id: string, displayName: string, achievements: ReadonlyArray<Achievement>) {
		this.id = id;
		this.displayName = displayName;
		this.achievements = achievements;
	}
}
