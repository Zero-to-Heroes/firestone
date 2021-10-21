import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { CardHistory } from '../../models/card-history';
import { Coin } from '../../models/coin';
import { PackInfo } from '../../models/collection/pack-info';
import {
	LOCAL_STORAGE_CARDS_HISTORY,
	LOCAL_STORAGE_CARD_BACKS,
	LOCAL_STORAGE_COINS,
	LOCAL_STORAGE_COLLECTION,
	LOCAL_STORAGE_PACK_INFOS,
} from '../local-storage';

declare let amplitude;

@Injectable()
export class CollectionStorageService {
	public dbInit: boolean;

	private db: AngularIndexedDB;

	constructor() {
		this.init();
	}

	public async saveCollection(collection: readonly Card[]): Promise<readonly Card[]> {
		localStorage.setItem(LOCAL_STORAGE_COLLECTION, JSON.stringify(collection));
		return collection;
	}

	public async saveCardBacks(cardBacks: readonly CardBack[]): Promise<readonly CardBack[]> {
		localStorage.setItem(LOCAL_STORAGE_CARD_BACKS, JSON.stringify(cardBacks));
		return cardBacks;
	}

	public async savePackInfos(packInfos: readonly PackInfo[]): Promise<readonly PackInfo[]> {
		localStorage.setItem(LOCAL_STORAGE_PACK_INFOS, JSON.stringify(packInfos));
		return packInfos;
	}

	public async saveCoins(coins: readonly Coin[]): Promise<readonly Coin[]> {
		localStorage.setItem(LOCAL_STORAGE_COINS, JSON.stringify(coins));
		return coins;
	}

	public async getCollection(): Promise<readonly Card[]> {
		const fromStorage = localStorage.getItem(LOCAL_STORAGE_COLLECTION);
		if (!!fromStorage) {
			return JSON.parse(fromStorage);
		}

		amplitude.getInstance().logEvent('load-from-indexeddb', { 'category': 'collection' });
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			const result = collection?.length > 0 ? collection.find((info) => info.id === 1)?.cards ?? [] : [];
			this.saveCollection(result);
			return result;
		} catch (e) {
			console.error('[collection] [storage] could not get collection', e.message, e.name, e);
		}
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		const fromStorage = localStorage.getItem(LOCAL_STORAGE_CARD_BACKS);
		if (!!fromStorage) {
			return JSON.parse(fromStorage);
		}

		amplitude.getInstance().logEvent('load-from-indexeddb', { 'category': 'card-backs' });
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			const result = collection?.length > 0 ? collection.find((info) => info.id === 2)?.cardBacks ?? [] : [];
			this.saveCardBacks(result);
			return result;
		} catch (e) {
			console.error('[collection] [storage] could not get cardBacks', e.message, e.name, e);
		}
	}

	public async getPackInfos(): Promise<readonly PackInfo[]> {
		const fromStorage = localStorage.getItem(LOCAL_STORAGE_PACK_INFOS);
		if (!!fromStorage) {
			return JSON.parse(fromStorage);
		}

		amplitude.getInstance().logEvent('load-from-indexeddb', { 'category': 'pack-infos' });
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			const result = collection?.length > 0 ? collection.find((info) => info.id === 3)?.packInfos ?? [] : [];
			this.savePackInfos(result);
			return result;
		} catch (e) {
			console.error('[collection] [storage] could not get pack infos', e.message, e.name, e);
		}
	}

	public async getCoins(): Promise<readonly Coin[]> {
		const fromStorage = localStorage.getItem(LOCAL_STORAGE_COINS);
		if (!!fromStorage) {
			return JSON.parse(fromStorage);
		}

		amplitude.getInstance().logEvent('load-from-indexeddb', { 'category': 'coins' });
		await this.waitForDbInit();
		try {
			const collection = await this.db.getAll('collection', null);
			const result = collection?.length > 0 ? collection.find((info) => info.id === 4)?.coins ?? [] : [];
			this.saveCoins(result);
			return result;
		} catch (e) {
			console.error('[collection] [storage] could not get coins', e.message, e.name, e);
		}
	}

	public async saveCardHistory(history: CardHistory): Promise<CardHistory> {
		const fromStorage = localStorage.getItem(LOCAL_STORAGE_CARDS_HISTORY);
		const historyList: readonly CardHistory[] = !!fromStorage ? JSON.parse(fromStorage) : [];
		const newHistory = [history, ...historyList];
		localStorage.setItem(LOCAL_STORAGE_CARDS_HISTORY, JSON.stringify(newHistory));
		return history;
	}

	public async saveFullCardHistory(history: readonly CardHistory[]): Promise<readonly CardHistory[]> {
		localStorage.setItem(LOCAL_STORAGE_CARDS_HISTORY, JSON.stringify(history));
		return history;
	}

	public async countCardHistory(): Promise<number> {
		const fullHistory = await this.getAllCardHistory(0);
		return fullHistory.length;
	}

	public async getAllCardHistory(limit: number): Promise<readonly CardHistory[]> {
		const fromStorage = localStorage.getItem(LOCAL_STORAGE_CARDS_HISTORY);
		if (!!fromStorage) {
			const result: readonly CardHistory[] = JSON.parse(fromStorage);
			return result.slice(0, limit);
		}

		amplitude.getInstance().logEvent('load-from-indexeddb', { 'category': 'cards-history' });
		await this.waitForDbInit();
		try {
			const histories = await this.db.getAll('card-history', null, {
				indexName: 'creationTimestamp',
				order: 'desc',
			});
			this.saveFullCardHistory(histories);
			return limit === 0 ? histories : histories.slice(0, limit);
		} catch (e) {
			console.error('[collection] [storage] could not get card history', e.message, e.name, e);
		}
	}

	private init() {
		console.log('[collection] [storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-collection-db', 10);
		this.db
			.openDatabase(10, (evt) => {
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
				(error) => {
					console.error('[collection] [storage] error in openDatabase', error);
					setTimeout(() => {
						this.init();
					}, 100);
				},
			);
	}

	private waitForDbInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.dbInit) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
