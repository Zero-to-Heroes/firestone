import { Injectable } from '@angular/core';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { AchievementsLocalDbService } from './indexed-db.service';

@Injectable()
export class AchievementHistoryStorageService {
	constructor(private indexedDb: AchievementsLocalDbService) {}

	public async save(history: AchievementHistory): Promise<void> {
		return this.indexedDb.saveHistory(history);
	}

	public loadAll(): Promise<AchievementHistory[]> {
		return this.indexedDb.loadAllHistory();
	}
}
