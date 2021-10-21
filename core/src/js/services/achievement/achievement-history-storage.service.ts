import { Injectable } from '@angular/core';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { AchievementsStorageService } from './achievements-storage.service';

@Injectable()
export class AchievementHistoryStorageService {
	constructor(private storage: AchievementsStorageService) {}

	public async save(history: AchievementHistory): Promise<void> {
		return this.storage.saveHistory(history);
	}

	public loadAll(): Promise<readonly AchievementHistory[]> {
		return this.storage.loadAllHistory();
	}
}
