import { Achievement } from './achievement'

export class AchievementSet {

	id: string;
	achievements: Achievement[] = [];

	constructor(id: string) {
		this.id = id;
	}
}
