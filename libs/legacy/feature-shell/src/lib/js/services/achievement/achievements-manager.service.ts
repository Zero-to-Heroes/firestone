import { Injectable } from '@angular/core';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { HsAchievementInfo } from './achievements-info';
import { AchievementsStorageService } from './achievements-storage.service';

@Injectable()
export class AchievementsManager {
	// TODO: update the achievements if the player goes into the game
	constructor(
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: AchievementsStorageService,
	) {}

	public async getAchievements(forceMemory = false, shouldLog = true): Promise<readonly HsAchievementInfo[]> {
		const achievements = await this.memoryReading.getAchievementsInfo();
		if (!achievements?.achievements?.length) {
			if (!forceMemory) {
				const fromDb = await this.db.retrieveInGameAchievements();
				return fromDb?.achievements || [];
			} else {
				return [];
			}
		} else {
			const savedCollection = await this.db.saveInGameAchievements(achievements);
			return savedCollection?.achievements || [];
		}
	}
}
