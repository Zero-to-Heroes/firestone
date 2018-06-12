import { Injectable } from '@angular/core';

import { CompletedAchievement } from '../../models/completed-achievement';
import { IndexedDbService } from './indexed-db.service';
import { Events } from '../events.service';

@Injectable()
export class AchievementsStorageService {

	constructor(
		private events: Events,
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
