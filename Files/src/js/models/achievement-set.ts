import { Achievement } from './achievement'

export class AchievementSet {

	id: string;
	displayName: string;
	achievements: Achievement[] = [];

	constructor(id: string,, displayName: string) {
		this.id = id;
		this.displayName = displayName;
	}
}
