import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';

import { CompletedAchievement } from '../../models/completed-achievement';
import { AchievementHistory } from '../../models/achievement/achievement-history';

@Injectable()
export class IndexedDbService {

	public dbInit: boolean;

	private db: AngularIndexedDB;

	constructor() {
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

		console.log('[achievements] [storage] Loading achievement', achievementId);
		this.db.getByKey('achievements', achievementId).then(
			(achievement) => {
				console.log('[achievements] [storage] loaded completed achievement', achievement);
				callback(achievement);
			},
			(error) => {
			    console.error('[achievements] [storage] error while loading achievement', achievementId, error);
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

		console.log('[achievements] [storage] Saving achievement', achievement);
		if (achievement.numberOfCompletions > 1) {
			this.db.update('achievements', achievement).then(
				(achievement) => {
					callback(achievement);
				},
				(error) => {
				    console.error('[achievements] [storage] error while updating achievement', achievement, error);
				}
			);
		}
		else {
			this.db.add('achievements', achievement).then(
				(achievement) => {
					callback(achievement);
				},
				(error) => {
				    console.error('[achievements] [storage] error while adding achievement', achievement, error);
				}
			);
		}
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
				console.log('[achievements] [storage] loaded all achievements', achievements);
				callback(achievements);
			}
		)
	}
	
	public loadAllHistory(): Promise<AchievementHistory[]> {
		return new Promise<AchievementHistory[]>((resolve) => {
			this.waitForDbInit().then(() => {
				this.db.getAll('achievement-history', null).then((history: AchievementHistory[]) => {
					resolve(history);
				});
			});
		});
	}
	
	public saveHistory(history: AchievementHistory) {
		this.waitForDbInit().then(() => {
			this.db.add('achievement-history', history).then((saved) => {
				console.log('[achievements] [storage] saved history', saved);
			}, (error) => console.error('[achievements] [storage] error while saving', history, error));
		});
	}

	private init() {
		console.log('[achievements] [storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-achievements-db', 2);
		this.db.openDatabase(2, (evt) => {
			console.log('[achievements] [storage] opendb successful', evt);
			if (evt.oldVersion < 1) {
				console.log('[achievements] [storage] creating achievements store');
				evt.currentTarget.result.createObjectStore('achievements', { keyPath: "id" });
			}
			if (evt.oldVersion < 2) {
				console.log('[achievements] [storage] upgrade to version 2');
				evt.currentTarget.result.createObjectStore('achievement-history', { keyPath: "id", autoIncrement: true });
			}
		    this.dbInit = true;
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

	private waitForDbInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				console.log('Promise waiting for db');
				if (this.dbInit) {
					console.log('wait for db init complete');
					resolve();
				} 
				else {
					console.log('waiting for db init');
					setTimeout(() => dbWait(), 50);
				}
			}
			dbWait();
		});
	}
}
