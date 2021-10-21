import { Injectable } from '@angular/core';
import { CardHistory } from '../../models/card-history';
import { CollectionStorageService } from './collection-storage.service';

@Injectable()
export class CardHistoryStorageService {
	constructor(private storage: CollectionStorageService) {}

	public async loadAll(limit: number): Promise<readonly CardHistory[]> {
		return this.storage.getAllCardHistory(limit);
	}

	public async countHistory(): Promise<number> {
		return this.storage.countCardHistory();
	}

	public async newHistory(history: CardHistory) {
		const result = await this.storage.saveCardHistory(history);
	}
}
