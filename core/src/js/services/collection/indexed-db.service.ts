import { Injectable } from '@angular/core';
import { AngularIndexedDB, IndexDetails } from 'angular2-indexeddb';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { CardHistory } from '../../models/card-history';
import { Coin } from '../../models/coin';
import { PackInfo } from '../../models/collection/pack-info';

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

	public async saveCardBacks(cardBacks: readonly CardBack[]): Promise<readonly CardBack[]> {
		await this.waitForDbInit();
		const dbCollection = {
			id: 2,
			cardBacks: cardBacks,
		};
		return new Promise<readonly CardBack[]>(resolve => {
			this.saveCardBacksInternal(dbCollection, result => resolve(result));
		});
	}

	private async saveCardBacksInternal(dbCollection, callback, retriesLeft = 10) {
		if (retriesLeft <= 0) {
			console.error('[collection] [storage] could not update card backs');
			callback(dbCollection.cardBacks);
			return;
		}
		try {
			await this.db.update('collection', dbCollection);
			callback(dbCollection.cardBacks);
			return;
		} catch (e) {
			console.warn('[collection] [storage] could not update card backs', e.message, e.name, e);
			setTimeout(() => this.saveCardBacksInternal(dbCollection, callback, retriesLeft - 1));
		}
	}

	public async savePackInfos(packInfos: readonly PackInfo[]): Promise<readonly PackInfo[]> {
		await this.waitForDbInit();
		const dbCollection = {
			id: 3,
			packInfos: packInfos,
		};
		return new Promise<readonly PackInfo[]>(resolve => {
			this.savePackInfosInternal(dbCollection, result => resolve(result));
		});
	}

	private async savePackInfosInternal(dbCollection, callback, retriesLeft = 10) {
		if (retriesLeft <= 0) {
			console.error('[collection] [storage] could not update pack infos');
			callback(dbCollection.packInfos);
			return;
		}
		try {
			await this.db.update('collection', dbCollection);
			callback(dbCollection.packInfos);
			return;
		} catch (e) {
			console.warn('[collection] [storage] could not update packInfos', e.message, e.name, e);
			setTimeout(() => this.savePackInfosInternal(dbCollection, callback, retriesLeft - 1));
		}
	}

	public async saveCoins(coins: readonly Coin[]): Promise<readonly Coin[]> {
		await this.waitForDbInit();
		const dbCollection = {
			id: 4,
			coins: coins,
		};
		return new Promise<readonly Coin[]>(resolve => {
			this.saveCoinsInternal(dbCollection, result => resolve(result));
		});
	}

	private async saveCoinsInternal(dbCollection, callback, retriesLeft = 10) {
		if (retriesLeft <= 0) {
			console.error('[collection] [storage] could not update coins');
			callback(dbCollection.cardBacks);
			return;
		}
		try {
			await this.db.update('collection', dbCollection);
			callback(dbCollection.coins);
			return;
		} catch (e) {
			console.warn('[collection] [storage] could not update coins', e.message, e.name, e);
			setTimeout(() => this.saveCoinsInternal(dbCollection, callback, retriesLeft - 1));
		}
	}

	public async getCollection(): Promise<Card[]> {
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			return collection?.length > 0 ? collection.find(info => info.id === 1)?.cards ?? [] : [];
		} catch (e) {
			console.error('[collection] [storage] could not get collection', e.message, e.name, e);
		}
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			return collection?.length > 0 ? collection.find(info => info.id === 2)?.cardBacks ?? [] : [];
		} catch (e) {
			console.error('[collection] [storage] could not get cardBacks', e.message, e.name, e);
		}
	}

	public async getPackInfos(): Promise<readonly PackInfo[]> {
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			return collection?.length > 0 ? collection.find(info => info.id === 3)?.packInfos ?? [] : [];
		} catch (e) {
			console.error('[collection] [storage] could not get pack infos', e.message, e.name, e);
		}
	}

	public async getCoins(): Promise<readonly Coin[]> {
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			return collection?.length > 0 ? collection.find(info => info.id === 4)?.coins ?? [] : [];
		} catch (e) {
			console.error('[collection] [storage] could not get coins', e.message, e.name, e);
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

	public async countHistory(): Promise<number> {
		await this.waitForDbInit();
		return new Promise<number>(resolve => {
			const transaction = this.db.dbWrapper.createTransaction({
				storeName: 'card-history',
				dbMode: 'readonly',
				error: (e: Event) => {
					console.error('[collection] [storage] counld not create transaction', e);
				},
				complete: () => {
					// Do nothing
				},
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
		this.db = new AngularIndexedDB('hs-collection-db', 10);
		this.db
			.openDatabase(10, evt => {
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
				// if (evt.oldVersion < 10) {
				// 	console.log('[collection] [storage] upgrade to version 10');
				// 	evt.currentTarget.result.createObjectStore('card-backs', { keyPath: 'id', autoIncrement: false });
				// }
				console.log('[collection] [storage] indexeddb upgraded');
			})
			.then(
				() => {
					console.log('[collection] [storage] openDatabase successful', this.db.dbWrapper.dbName);
					this.dbInit = true;
				},
				error => {
					console.error('[collection] [storage] error in openDatabase', error);
					setTimeout(() => {
						this.init();
					}, 100);
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
		return new Promise<any>((resolve, reject) => {
			this.db.dbWrapper.validateBeforeTransaction(storeName, reject);

			const transaction = this.db.dbWrapper.createTransaction({
				storeName: storeName,
				dbMode: 'readonly',
				error: (e: Event) => {
					reject(e);
				},
				complete: () => {
					// Do nothing
				},
			});
			const objectStore = transaction.objectStore(storeName);
			const result: any[] = [];
			let request: IDBRequest;
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
