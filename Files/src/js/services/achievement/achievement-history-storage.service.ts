import { Injectable } from '@angular/core';

import { IndexedDbService } from './indexed-db.service';
import { AchievementHistory } from '../../models/achievement/achievement-history';

@Injectable()
export class AchievementHistoryStorageService {

	constructor(private indexedDb: IndexedDbService) {
	}

	public save(history: AchievementHistory) {
		return this.indexedDb.saveHistory(history);
	}

	public loadAll(): Promise<AchievementHistory[]> {
		return this.indexedDb.loadAllHistory();
	}
}
