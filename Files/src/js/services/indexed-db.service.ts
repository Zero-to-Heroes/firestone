import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { AngularIndexedDB, IndexDetails } from 'angular2-indexeddb';

import { CardHistory } from '../models/card-history';

declare var OverwolfPlugin: any;

@Injectable()
export class IndexedDbService {

	private db: AngularIndexedDB;
	private dbInit: boolean;

	constructor(private localStorageService: LocalStorageService) {
		this.init();
	}

	public save(history: CardHistory, callback: Function) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.save(history, callback);
			}, 50);
			return;
		}

		this.db.add('card-history', history).then(
			(history) => {
				callback(history);
			},
			(error) => {
			    console.log(error);
			}
		);
	}

	public getAll(callback: Function, fromTimestamp?: number) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.getAll(callback);
			}, 50);
			return;
		}

		let range = undefined;
		if (fromTimestamp) {
			range = IDBKeyRange.lowerBound(fromTimestamp);
		}
		this.db.getAll('card-history', range).then(
			(histories) => {
				console.log('loaded achievements', fromTimestamp, range, histories);
				callback(histories);
			}
		)
	}

	private init() {
		console.log('[storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-collection-db', 1);
		this.db.openDatabase(1, (evt) => {
		    let objectStore = evt.currentTarget.result.createObjectStore(
		    	'card-history',
		    	{ keyPath: "id", autoIncrement: true });
		    objectStore.createIndex("creationTimestamp", "creationTimestamp", { unique: false });

		    this.dbInit = true;
		    console.log('[storage] objectstore created', objectStore);
		}).then(
			() => {
				console.log('[storage] openDatabase successful', this.db);
		    	this.dbInit = true;
			},
			(error) => {
				console.log('[storage] error in openDatabase', error);
			}
		);

	}
}
