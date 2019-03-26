import { Injectable } from '@angular/core';

import { CompletedAchievement } from '../../models/completed-achievement';

import { IndexedDbService } from './indexed-db.service';
import { ReplayInfo } from '../../models/replay-info';

@Injectable()
export class AchievementsStorageService {

	constructor(
		// private store: MainWindowStoreService,
		private indexedDb: IndexedDbService) {
	}

	public async loadAchievement(achievementId: string): Promise<CompletedAchievement> {
		return this.indexedDb.getAchievement(achievementId);
	}

	public async saveAchievement(achievement: CompletedAchievement): Promise<CompletedAchievement> {
		const completedAchievement = await this.indexedDb.save(achievement);
		return completedAchievement;
	}

	public async loadAchievements(): Promise<CompletedAchievement[]> {
		return this.indexedDb.getAll();
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
