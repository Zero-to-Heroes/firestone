import { Injectable } from '@angular/core';

import { CardHistory } from '../models/card-history';

import { IndexedDbService } from '../services/indexed-db.service';

@Injectable()
export class CardHistoryStorageService {

	constructor(private indexedDb: IndexedDbService) {
	}

	public loadAll(callback: Function, limit: number) {
		this.indexedDb.getAll(
			(result) => {
				callback(result);
			},
			limit);
	}

	public countHistory(callback: Function) {
		this.indexedDb.countHistory(callback);
	}

	public newCard(history: CardHistory) {
		this.indexedDb.save(history, (result) => {
			console.log('new card history saved', result);
		})
	}

	public newDust(history: CardHistory) {
		this.indexedDb.save(history, (result) => {
			console.log('new dust history saved', result);
		})
	}
}
