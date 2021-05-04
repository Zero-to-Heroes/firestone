import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';
import { Preferences } from '../models/preferences';

@Injectable()
export class GenericIndexedDbService {
	private dbInit: boolean;
	private db: AngularIndexedDB;

	constructor() {
		this.init();
	}

	public async saveUserPreferences(preferences: Preferences): Promise<Preferences> {
		await this.waitForDbInit();
		return new Promise<Preferences>((resolve) => {
			try {
				this.db.update('user-preferences', preferences).then((preferences: Preferences) => {
					resolve(preferences);
				});
			} catch (e) {
				console.error('[generic-storage] could not update user prefs', e.message, e.name, e);
				resolve(preferences);
			}
		});
	}

	public async getUserPreferences(): Promise<Preferences> {
		await this.waitForDbInit();
		return new Promise<Preferences>((resolve) => {
			try {
				this.db.getAll('user-preferences').then((preferences: Preferences[]) => {
					resolve(Object.assign(new Preferences(), preferences[0] || {}));
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
					// console.log('[storage] waiting for init');
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
