import { Injectable } from '@angular/core';
import { Events } from '../events.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { HsAchievementInfo } from './achievements-info';
import { AchievementsStorageService } from './achievements-storage.service';

@Injectable()
export class AchievementsManager {
	// TODO: update the achievements if the player goes into the game
	constructor(
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: AchievementsStorageService,
		private readonly events: Events,
	) {}

	public async getAchievements(forceMemory = false, shouldLog = true): Promise<readonly HsAchievementInfo[]> {
		shouldLog && console.log('[achievements-manager] getting achievements');
		const achievements = await this.memoryReading.getAchievementsInfo();
		shouldLog &&
			console.log(
				'[achievements-manager] retrieved achievements from memory',
				achievements?.achievements?.length,
			);
		if (!achievements?.achievements?.length) {
			if (!forceMemory) {
				shouldLog && console.log('[achievements-manager] retrieving achievements from db');
				const fromDb = await this.db.retrieveInGameAchievements();
				shouldLog &&
					console.log('[achievements-manager] retrieved achievements from db', fromDb?.achievements?.length);
				return fromDb?.achievements || [];
			} else {
				return [];
			}
		} else {
			shouldLog && console.log('[achievements-manager] updating achievements in db');
			const savedCollection = await this.db.saveInGameAchievements(achievements);
			return savedCollection?.achievements || [];
		}
	}
}
