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

	public loadAchievement(achievementId: string): Promise<CompletedAchievement> {
		return new Promise<CompletedAchievement>((resolve) => {
			this.indexedDb.getAchievement(achievementId, (result: CompletedAchievement) => {
				resolve(result);
			});
		});
	}

	public saveAchievement(achievement: CompletedAchievement): Promise<CompletedAchievement> {
		return new Promise<CompletedAchievement>((resolve) => {
			this.indexedDb.save(achievement, (result) => {
				resolve(result);
			})
		});
	}

	public async loadAchievements(): Promise<CompletedAchievement[]> {
		return await this.indexedDb.getAll();
	}
}
