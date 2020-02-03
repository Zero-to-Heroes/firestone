import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { CompletedAchievement } from '../../models/completed-achievement';
import { ReplayInfo } from '../../models/replay-info';
import { OverwolfService } from '../overwolf.service';
import { AchievementsLocalDbService } from './indexed-db.service';

@Injectable()
export class AchievementsLocalStorageService {
	constructor(
		private logger: NGXLogger,
		private http: HttpClient,
		private ow: OverwolfService,
		private indexedDb: AchievementsLocalDbService,
	) {}

	// Here we just load from the local cache. The only time we refresh from the remote is when
	// we initialize the app.
	public async loadAchievementFromCache(achievementId: string): Promise<CompletedAchievement> {
		return this.indexedDb.getAchievement(achievementId);
	}

	public async cacheAchievement(achievement: CompletedAchievement): Promise<CompletedAchievement> {
		const completedAchievement = await this.indexedDb.save(achievement);
		return completedAchievement;
	}

	public async loadAchievementsFromCache(): Promise<readonly CompletedAchievement[]> {
		return this.indexedDb.getAll();
	}

	public async loadAllReplayInfos(): Promise<readonly CompletedAchievement[]> {
		return this.indexedDb.getAllReplayInfo();
	}

	public async removeReplay(achievementId: string, videoPath: string): Promise<CompletedAchievement> {
		const achievement: CompletedAchievement = await this.loadAchievementFromCache(achievementId);
		const updatedReplays: readonly ReplayInfo[] = achievement.replayInfo.filter(info => info.path !== videoPath);
		const updatedAchievement: CompletedAchievement = new CompletedAchievement(
			achievement.id,
			achievement.numberOfCompletions,
			updatedReplays,
		);
		return this.cacheAchievement(updatedAchievement);
	}
}
