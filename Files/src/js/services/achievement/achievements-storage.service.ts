import { Injectable } from '@angular/core';

import { CompletedAchievement } from '../../models/completed-achievement';
import { AchievementSet } from '../../models/achievement-set';
import { Achievement } from '../../models/achievement';

import { IndexedDbService } from './indexed-db.service';

@Injectable()
export class AchievementsStorageService {

	constructor(
		private indexedDb: IndexedDbService) {
	}

	public loadAchievement(achievementId: string, callback: Function) {
		this.indexedDb.getAchievement(achievementId, (result: CompletedAchievement) => {
			callback(result);
		});
	}

	public saveAchievement(achievement: CompletedAchievement, callback: Function) {
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
