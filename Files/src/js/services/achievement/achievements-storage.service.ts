import { Injectable } from '@angular/core';

import { Achievement } from '../../models/achievement';
import { IndexedDbService } from './indexed-db.service';
import { Events } from '../events.service';

@Injectable()
export class AchievementsStorageService {

	constructor(
		private events: Events,
		private indexedDb: IndexedDbService) {
	}

	public checkAchievement(achievement: Achievement, callback: Function) {
		this.indexedDb.getAchievement(achievement.id, (result) => {
			callback(result != null);
			// callback(false);
		});
	}

	public claim(achievement: Achievement, callback: Function) {
		this.indexedDb.save(achievement, (result) => {
			callback(result);
		})
	}

	public loadAchievements(callback: Function) {
		this.indexedDb.getAll((result) => {
			callback(result);
		})
	}
}
