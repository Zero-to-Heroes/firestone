import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';
import { Preferences } from '../models/preferences';
import { LOCAL_STORAGE_USER_PREFERENCES } from './local-storage';

declare let amplitude;

@Injectable()
export class GenericStorageService {
	private dbInit: boolean;
	private db: AngularIndexedDB;

	constructor() {
		this.init();
	}

	public async saveUserPreferences(preferences: Preferences): Promise<Preferences> {
		localStorage.setItem(LOCAL_STORAGE_USER_PREFERENCES, JSON.stringify(preferences));
		return preferences;
	}

	public async getUserPreferences(): Promise<Preferences> {
		const fromStorage = localStorage.getItem(LOCAL_STORAGE_USER_PREFERENCES);
		if (!!fromStorage) {
			const result = Object.assign(new Preferences(), JSON.parse(fromStorage));
			const resultWithDate: Preferences = {
				...result,
				lastUpdateDate: result.lastUpdateDate ? new Date(result.lastUpdateDate) : null,
			};
			return resultWithDate;
		}

		amplitude.getInstance().logEvent('load-from-indexeddb', { 'category': 'user-prefs' });
		await this.waitForDbInit();
		return new Promise<Preferences>((resolve) => {
			try {
				this.db.getAll('user-preferences').then((preferences: Preferences[]) => {
					const result = Object.assign(new Preferences(), preferences[0] || {});
					this.saveUserPreferences(result);
					resolve(result);
				});
			} catch (e) {
				console.error('[generic-storage] could not get user prefs', e.message, e.name, e);
				resolve(new Preferences());
			}
		});
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

	private init() {
		console.log('[storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-generic-db', 1);
		this.db
			.openDatabase(1, (evt) => {
				console.log('[storage] upgrading db', evt);
				if (evt.oldVersion < 1) {
					console.log('[storage] upgrade to version 1');
					evt.currentTarget.result.createObjectStore('user-preferences', {
						keyPath: 'id',
						autoIncrement: false,
					});
				}
				console.log('[storage] indexeddb upgraded');
			})
			.then(
				() => {
					console.log('[storage] openDatabase successful', this.db.dbWrapper.dbName);
					this.dbInit = true;
				},
				(error) => {
					console.error('[storage] error in openDatabase', error);
				},
			);
	}
}
