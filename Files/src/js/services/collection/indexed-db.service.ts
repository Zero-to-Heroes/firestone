import { Injectable } from '@angular/core';
import { AngularIndexedDB, IndexDetails } from 'angular2-indexeddb';

import { CardHistory } from '../../models/card-history';
import { Card } from '../../models/card';
import { PackHistory } from '../../models/pack-history';
import { PityTimer } from '../../models/pity-timer';

declare var OverwolfPlugin: any;

@Injectable()
export class IndexedDbService {

	public dbInit: boolean;

	private db: AngularIndexedDB;

	constructor() {
		this.init();
	}

	public saveCollection(collection: Card[], callback: Function) {
		// console.log('saving collection');
		let dbCollection = {
			id: 1,
			cards: collection
		}
		// console.log('saving collection', dbCollection);
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.saveCollection(collection, callback);
			}, 50);
			return;
		}

		// console.log('updating collection');
		this.db.update('collection', dbCollection).then(
			(history) => {
				// console.log('callback from save collection')
				callback(collection);
			},
			(error) => {
				console.error('could not update collection', error);
			}
		);
	}

	public getCollection(callback: Function) {
		// console.log('retrieving collection');
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.getCollection(callback);
			}, 50);
			return;
		}

		this.db.getAll('collection', null)
			.then((collection) => {
				// console.log('loaded collection', collection);
				callback(collection[0] ? collection[0].cards : []);
			})
	}

	public save(history: CardHistory, callback: Function) {
		console.log('saving history', history);
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

    public saveNewPack(newPack: PackHistory, callback: Function): any {
		console.log('saving pack history', newPack);
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.saveNewPack(newPack, callback);
			}, 50);
			return;
		}

		this.db.add('pack-history', newPack).then(
			(history) => {
				callback(history);
			},
			(error) => {
				console.log(error);
			}
		);
	}
	
    public getPityTimer(setId: any): Promise<PityTimer> {
		return new Promise<PityTimer>((resolve) => {
			this.waitForDbInit().then(() => {
				this.db.getByKey('pity-timer', setId).then((pityTimer: PityTimer) => {
					resolve(pityTimer);
				});
			});
		});
	}
	
    public getAllPityTimers(): Promise<PityTimer[]> {
		console.log('getting all pity timers');
		return new Promise<PityTimer[]>((resolve) => {
			console.log('in getAllPityTimers promise');
			this.waitForDbInit().then(() => {
				console.log('fetching all pity timers from db');
				this.db.getAll('pity-timer', null).then((pityTimers: PityTimer[]) => {
					console.log('fetched pity timers', pityTimers);
					resolve(pityTimers);
				});
			});
		});
	}
	
    public savePityTimer(pityTimer: PityTimer, callback: Function) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.savePityTimer(pityTimer, callback);
			}, 50);
			return;
		}
		this.db.update('pity-timer', pityTimer).then(
			(history) => {
				callback(pityTimer);
			},
			(error) => {
				console.error('could not update pity timer', pityTimer, error);
			}
		);
    }

	public countHistory(callback: Function) {
		console.log('counting history');
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.countHistory(callback);
			}, 50);
			return;
		}

		let transaction = this.db.dbWrapper.createTransaction({ storeName: 'card-history',
			dbMode: "readonly",
			error: (e: Event) => {
				console.error('counld not create transaction', e);
			},
			complete: (e: Event) => {
			}
		});
		let objectStore: IDBObjectStore = transaction.objectStore('card-history');
		let request = objectStore.count();

		request.onerror = function (e) {
			console.error('counld not count', e);
		};

		request.onsuccess = function (evt: any) {
			console.log('could count', evt);
			callback(evt.target.result);
		};

	}

	public getAll(callback: Function, limit: number) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.getAll(callback, limit);
			}, 50);
			return;
		}

		if (limit == 0) {
			this.db.getAll('card-history', null, {indexName: 'creationTimestamp', order: 'desc'})
				.then((histories) => {
					// console.log('loaded history', limit, histories);
					callback(histories);
				});
			return;
		}

		this.getAllWithLimit('card-history', limit, {indexName: 'creationTimestamp', order: 'desc'}).then(
			(histories) => {
				// console.log('loaded history', limit, histories);
				callback(histories);
			}
		)
	}

	private init() {
		console.log('[storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-collection-db', 9);
		this.db.openDatabase(9, (evt) => {
			console.log('upgrading db', evt);

			if (evt.oldVersion < 1) {
				console.log('[storage] upgrade to version 1');
				let objectStore = evt.currentTarget.result.createObjectStore(
					'card-history',
					{ keyPath: "id", autoIncrement: true });
				objectStore.createIndex("creationTimestamp", "creationTimestamp", { unique: false });
				objectStore.createIndex("isNewCard", "isNewCard", { unique: false });
			}
			if (evt.oldVersion < 2) {
				console.log('[storage] upgrade to version 2');
				let collectionStore = evt.currentTarget.result.createObjectStore(
					'collection',
					{ keyPath: "id", autoIncrement: false });
			}
			if (evt.oldVersion < 8) {
				console.log('[storage] upgrade to version 8');
				evt.currentTarget.result.createObjectStore(
					'pack-history',
					{ keyPath: "id", autoIncrement: true });
				}
			if (evt.oldVersion < 9) {
				evt.currentTarget.result.createObjectStore(
					'pity-timer',
					{ keyPath: "setId", autoIncrement: false });
			}
			console.log('[storage] indexeddb upgraded');
		}).then(
			() => {
				console.log('[storage] openDatabase successful', this.db.dbWrapper.dbName);
				this.dbInit = true;
			},
			(error) => {
				console.log('[storage] error in openDatabase', error);
			}
		);
	}

	private waitForDbInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				// console.log('Promise waiting for db');
				if (this.dbInit) {
					// console.log('wait for db init complete');
					resolve();
				} 
				else {
					// console.log('waiting for db init');
					setTimeout(() => dbWait(), 50);
				}
			}
			dbWait();
		});
	}

	private getAllWithLimit(storeName: string, limit: number, indexDetails?: IndexDetails) {
		let self = this;
		return new Promise<any>((resolve, reject)=> {
			self.db.dbWrapper.validateBeforeTransaction(storeName, reject);

			let transaction = self.db.dbWrapper.createTransaction({ storeName: storeName,
					dbMode: "readonly",
					error: (e: Event) => {
						reject(e);
					},
					complete: (e: Event) => {
					}
				}),
				objectStore = transaction.objectStore(storeName),
				result: Array<any> = [],
				request: IDBRequest;
				if(indexDetails) {
					let index = objectStore.index(indexDetails.indexName),
						order = (indexDetails.order === 'desc') ? 'prev' : 'next';
					request = index.openCursor(null, <IDBCursorDirection>order);
				}
				else {
					request = objectStore.openCursor(null);
				}

			request.onerror = function (e) {
				reject(e);
			};

			request.onsuccess = function (evt: Event) {
				let cursor = (<IDBOpenDBRequest>evt.target).result;
				if (cursor && result.length < limit) {
					result.push(cursor.value);
					cursor["continue"]();
				} else {
					resolve(result);
				}
			};
		});
	}
}
