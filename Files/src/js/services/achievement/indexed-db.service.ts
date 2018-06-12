import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { AngularIndexedDB } from 'angular2-indexeddb';

import { CompletedAchievement } from '../../models/completed-achievement';

declare var OverwolfPlugin: any;

@Injectable()
export class IndexedDbService {

	public dbInit: boolean;

	private db: AngularIndexedDB;

	constructor(private localStorageService: LocalStorageService) {
		this.init();
	}

	public getAchievement(achievementId: string, callback: Function) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[achievements] [storage] db isnt initialized, waiting...');
				this.getAchievement(achievementId, callback);
			}, 50);
			return;
		}

		console.log('[achievements] Loading achievement', achievementId);
		this.db.getByKey('achievements', achievementId).then(
			(achievement) => {
				callback(achievement);
			},
			(error) => {
			    console.log(error);
			}
		);
	}

	public save(achievement: CompletedAchievement, callback: Function) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[achievements] [storage] db isnt initialized, waiting...');
				this.save(achievement, callback);
			}, 50);
			return;
		}

		this.db.add('achievements', achievement).then(
			(achievement) => {
				callback(achievement);
			},
			(error) => {
			    console.log(error);
			}
		);
	}

	public getAll(callback: Function) {
		if (!this.dbInit) {
			setTimeout(() => {
				console.log('[achievements] [storage] db isnt initialized, waiting...');
				this.getAll(callback);
			}, 50);
			return;
		}

		this.db.getAll('achievements').then(
			(achievements) => {
				console.log('[achievements] loaded all achievements', achievements);
				callback(achievements);
			}
		)
	}

	private init() {
		console.log('[achievements] [storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-achievements-db', 1);
		this.db.openDatabase(1, (evt) => {
		    let objectStore = evt.currentTarget.result.createObjectStore('achievements', { keyPath: "id" });
		    this.dbInit = true;
		    console.log('[achievements] [storage] objectstore created', objectStore);
		}).then(
			() => {
				console.log('[achievements] [storage] openDatabase successful', this.db.dbWrapper.dbName);
		    	this.dbInit = true;
			},
			(error) => {
				console.log('[achievements] [storage] error in openDatabase', error);
			}
		);

	}
}
