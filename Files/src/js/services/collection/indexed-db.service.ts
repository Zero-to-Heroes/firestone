import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { AngularIndexedDB, IndexDetails } from 'angular2-indexeddb';

import { CardHistory } from '../../models/card-history';
import { Card } from '../../models/card';

declare var OverwolfPlugin: any;

@Injectable()
export class IndexedDbService {

	private db: AngularIndexedDB;
	private dbInit: boolean;

	constructor(private localStorageService: LocalStorageService) {
		this.init();
	}

	public saveCollection(collection: Card[], callback: Function) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.saveCollection(collection, callback);
			}, 50);
			return;
		}

		this.db.add('collection', collection).then(
			(history) => {
				callback(collection);
			},
			(error) => {
			    console.log(error);
			}
		);
	}

	public getCollection(callback: Function) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[storage] db isnt initialized, waiting...');
				this.getCollection(callback);
			}, 50);
			return;
		}

		this.db.getAll('collection', null)
			.then((collection) => {
				console.log('loaded history', collection);
				callback(collection);
			})
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

	public countHistory(callback: Function) {
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
					console.log('loaded history', limit, histories);
					callback(histories);
				});
			return;
		}

		this.getAllWithLimit('card-history', limit, {indexName: 'creationTimestamp', order: 'desc'}).then(
			(histories) => {
				console.log('loaded history', limit, histories);
				callback(histories);
			}
		)
	}

	private init() {
		console.log('[storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-collection-db', 1);
		this.db.openDatabase(1, (evt) => {
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
		    	let collectionStore = evt.currentTarget.result.createObjectStore('collection', {});
		    }

		    this.dbInit = true;
		    console.log('[storage] indexeddb upgraded');
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
