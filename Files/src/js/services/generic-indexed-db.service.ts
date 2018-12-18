import { Injectable } from '@angular/core';
import { AngularIndexedDB, IndexDetails } from 'angular2-indexeddb';
import { Preferences } from '../models/preferences';

@Injectable()
export class GenericIndexedDbService {

	private dbInit: boolean;
	private db: AngularIndexedDB;

	constructor() {
		this.init();
	}
	
    public saveUserPreferences(preferences: Preferences): Promise<Preferences> {
		return new Promise<Preferences>((resolve) => {
			this.waitForDbInit().then(() => {
				this.db.update('user-preferences', preferences).then((preferences: Preferences) => {
					resolve(preferences);
				});
			});
		});
	}
	
    public getUserPreferences(): Promise<Preferences> {
		return new Promise<Preferences>((resolve) => {
			this.waitForDbInit().then(() => {
				this.db.getAll('user-preferences').then((preferences: Preferences[]) => {
					resolve(preferences[0] || new Preferences(false, false, false));
				});
			});
		});
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

	private init() {
		console.log('[storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-generic-db', 1);
		this.db.openDatabase(1, (evt) => {
			console.log('upgrading db', evt);

			if (evt.oldVersion < 1) {
				console.log('[storage] upgrade to version 1');
				let objectStore = evt.currentTarget.result.createObjectStore(
					'user-preferences',
					{ keyPath: "id", autoIncrement: false });
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
}
