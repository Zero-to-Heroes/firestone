import { Injectable } from '@angular/core';
import { AngularIndexedDB, IndexDetails } from 'angular2-indexeddb';
import { Card } from '../../models/card';
import { CardHistory } from '../../models/card-history';
import { PackHistory } from '../../models/pack-history';
import { PityTimer } from '../../models/pity-timer';

@Injectable()
export class IndexedDbService {
	public dbInit: boolean;

	private db: AngularIndexedDB;

	constructor() {
		this.init();
	}

	public async saveCollection(collection: readonly Card[]): Promise<Card[]> {
		await this.waitForDbInit();
		const dbCollection = {
			id: 1,
			cards: collection,
		};
		return new Promise<Card[]>(resolve => {
			this.saveCollectionInternal(dbCollection, result => resolve(result));
		});
	}

	private async saveCollectionInternal(dbCollection, callback, retriesLeft = 10) {
		if (retriesLeft <= 0) {
			console.error('[collection] [storage] could not update collection');
			callback(dbCollection.cards);
			return;
		}
		try {
			await this.db.update('collection', dbCollection);
			callback(dbCollection.cards);
			return;
		} catch (e) {
			console.warn('[collection] [storage] could not update collection', e.message, e.name, e);
			setTimeout(() => this.saveCollectionInternal(dbCollection, callback, retriesLeft - 1));
		}
	}

	public async getCollection(): Promise<Card[]> {
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			return collection[0] ? collection[0].cards : [];
		} catch (e) {
			console.error('[collection] [storage] could not get collection', e.message, e.name, e);
		}
	}

	public async save(history: CardHistory): Promise<CardHistory> {
		await this.waitForDbInit();
		try {
			const result = await this.db.add('card-history', history);
			return result;
		} catch (e) {
			console.error('[collection] [storage] error while saving history', e.message, e.name, e);
			return history;
		}
	}

	public async saveNewPack(newPack: PackHistory): Promise<PackHistory> {
		await this.waitForDbInit();
		try {
			console.log('[collection] [storage] saving pack history', newPack);
			const history = await this.db.add('pack-history', newPack);
			return history;
		} catch (e) {
			console.error('[collection] [storage] error while saving new pack', e.message, e.name, e);
			return newPack;
		}
	}

	public async getPityTimer(setId: any): Promise<PityTimer> {
		await this.waitForDbInit();
		try {
			const pityTimer = await this.db.getByKey('pity-timer', setId);
			return pityTimer;
		} catch (e) {
			console.error('[collection] [storage] could not get pity timer', e.message, e.name, e);
		}
	}

	public async getAllPityTimers(): Promise<PityTimer[]> {
		await this.waitForDbInit();
		try {
			const pityTimers = await this.db.getAll('pity-timer', null);
			return pityTimers;
		} catch (e) {
			console.error('[collection] [storage] could not get pity timers', e.message, e.name, e);
			return [];
		}
	}

	public async savePityTimer(pityTimer: PityTimer): Promise<PityTimer> {
		await this.waitForDbInit();
		try {
			await this.db.update('pity-timer', pityTimer);
			return pityTimer;
		} catch (e) {
			console.error('[collection] [storage] could not update pity timer', e.message, e.name, pityTimer, e);
			return pityTimer;
		}
	}

	public async countHistory(): Promise<number> {
		await this.waitForDbInit();
		return new Promise<number>(resolve => {
			const transaction = this.db.dbWrapper.createTransaction({
				storeName: 'card-history',
				dbMode: 'readonly',
				error: (e: Event) => {
					console.error('[collection] [storage] counld not create transaction', e);
				},
				complete: () => {},
			});
			const objectStore: IDBObjectStore = transaction.objectStore('card-history');
			const request = objectStore.count();

			request.onerror = function(e) {
				console.error('[collection] [storage] counld not count', e);
			};

			request.onsuccess = function(evt: any) {
				// console.log('could count', evt);
				resolve(evt.target.result);
			};
		});
	}

	public async getAll(limit: number): Promise<CardHistory[]> {
		await this.waitForDbInit();
		return new Promise<CardHistory[]>(resolve => {
			if (limit === 0) {
				this.db.getAll('card-history', null, { indexName: 'creationTimestamp', order: 'desc' }).then(
					histories => {
						resolve(histories);
					},
					error => {
						console.error('[collection] [storage] could not get all card history', error);
					},
				);
				return;
			}
			this.getAllWithLimit('card-history', limit, { indexName: 'creationTimestamp', order: 'desc' }).then(
				histories => {
					resolve(histories);
				},
				error => {
					console.error('[collection] [storage] could not get all card history with limit', error, limit);
				},
			);
		});
	}

	private init() {
		console.log('[collection] [storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-collection-db', 9);
		this.db
			.openDatabase(9, evt => {
				console.log('[collection] [storage] upgrading db', evt);
				if (evt.oldVersion < 1) {
					console.log('[collection] [storage] upgrade to version 1');
					const objectStore = evt.currentTarget.result.createObjectStore('card-history', {
						keyPath: 'id',
						autoIncrement: true,
					});
					objectStore.createIndex('creationTimestamp', 'creationTimestamp', { unique: false });
					objectStore.createIndex('isNewCard', 'isNewCard', { unique: false });
				}
				if (evt.oldVersion < 2) {
					console.log('[collection] [storage] upgrade to version 2');
					evt.currentTarget.result.createObjectStore('collection', { keyPath: 'id', autoIncrement: false });
				}
				if (evt.oldVersion < 8) {
					console.log('[collection] [storage] upgrade to version 8');
					evt.currentTarget.result.createObjectStore('pack-history', { keyPath: 'id', autoIncrement: true });
				}
				if (evt.oldVersion < 9) {
					console.log('[collection] [storage] upgrade to version 9');
					evt.currentTarget.result.createObjectStore('pity-timer', {
						keyPath: 'setId',
						autoIncrement: false,
					});
				}
				console.log('[collection] [storage] indexeddb upgraded');
			})
			.then(
				() => {
					console.log('[collection] [storage] openDatabase successful', this.db.dbWrapper.dbName);
					this.dbInit = true;
				},
				error => {
					console.error('[collection] [storage] error in openDatabase', error);
				},
			);
	}

	private waitForDbInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				if (this.dbInit) {
					resolve();
				} else {
					// console.log('[collection] [storage] waiting for init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}

	private getAllWithLimit(storeName: string, limit: number, indexDetails?: IndexDetails) {
		const self = this;
		return new Promise<any>((resolve, reject) => {
			self.db.dbWrapper.validateBeforeTransaction(storeName, reject);

			let transaction = self.db.dbWrapper.createTransaction({
					storeName: storeName,
					dbMode: 'readonly',
					error: (e: Event) => {
						reject(e);
					},
					complete: () => {},
				}),
				objectStore = transaction.objectStore(storeName),
				result: any[] = [],
				request: IDBRequest;
			if (indexDetails) {
				const index = objectStore.index(indexDetails.indexName),
					order = indexDetails.order === 'desc' ? 'prev' : 'next';
				request = index.openCursor(null, order as IDBCursorDirection);
			} else {
				request = objectStore.openCursor(null);
			}

			request.onerror = function(e) {
				reject(e);
			};

			request.onsuccess = function(evt: Event) {
				const cursor = (evt.target as IDBOpenDBRequest).result;
				if (cursor && result.length < limit) {
					result.push((cursor as any).value);
					cursor['continue']();
				} else {
					resolve(result);
				}
			};
		});
	}
}
