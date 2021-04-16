import { Injectable } from '@angular/core';
import { Events } from '../events.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { HsAchievementInfo } from './achievements-info';
import { AchievementsLocalDbService } from './indexed-db.service';

@Injectable()
export class AchievementsManager {
	// TODO: update the achievements if the player goes into the game
	constructor(
		private readonly memoryReading: MemoryInspectionService,
		private readonly db: AchievementsLocalDbService,
		private readonly events: Events,
	) {}

	public async getAchievements(forceMemory = false): Promise<readonly HsAchievementInfo[]> {
		// console.log('[achievements-manager] getting achievements');
		const achievements = await this.memoryReading.getAchievementsInfo();
		// console.log('[achievements-manager] retrieved achievements from memory', achievements?.achievements?.length);
		if (!achievements?.achievements?.length) {
			if (!forceMemory) {
				// console.log('[achievements-manager] retrieving achievements from db');
				const fromDb = await this.db.retrieveInGameAchievements();
				// console.log('[achievements-manager] retrieved achievements from db', fromDb?.achievements?.length);
				return fromDb?.achievements || [];
			} else {
				return [];
			}
		} else {
			// console.log('[achievements-manager] updating achievements in db');
			const savedCollection = await this.db.saveInGameAchievements(achievements);
			return savedCollection?.achievements || [];
		}
	}
}
