import { Injectable } from '@angular/core';

import { CompletedAchievement } from '../../models/completed-achievement';
import { AchievementSet } from '../../models/achievement-set';
import { Achievement } from '../../models/achievement';

import { IndexedDbService } from './indexed-db.service';
import { ReplayInfo } from '../../models/replay-info';

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

	public async removeReplay(achievementId: string, videoPath: string): Promise<CompletedAchievement> {
		const achievement: CompletedAchievement = await this.loadAchievement(achievementId);
		const updatedReplays: ReadonlyArray<ReplayInfo> = achievement.replayInfo
				.filter((info) => info.path !== videoPath);
		const updatedAchievement: CompletedAchievement = new CompletedAchievement(
			achievement.id,
			achievement.numberOfCompletions,
			updatedReplays);
		return this.saveAchievement(updatedAchievement);
    }
}
