import { Injectable } from '@angular/core';
import { CardHistory } from '../../models/card-history';
import { IndexedDbService } from './indexed-db.service';

@Injectable()
export class CardHistoryStorageService {
	constructor(private indexedDb: IndexedDbService) {}

	public async loadAll(limit: number): Promise<readonly CardHistory[]> {
		return this.indexedDb.getAll(limit);
	}

	public async countHistory(): Promise<number> {
		return this.indexedDb.countHistory();
	}

	public async newHistory(history: CardHistory) {
		const result = await this.indexedDb.save(history);
	}
}
