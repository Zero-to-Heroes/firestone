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

	public async getAchievement(achievementId: string): Promise<CompletedAchievement> {
		await this.waitForDbInit();
		try {
			const achievement = await this.db.getByKey('achievements', achievementId);
			return achievement;
		}
		catch (e) {
			console.error('[achievements] [storage] error while loading completed achievement', e);
		}
	}

	public async save(achievement: CompletedAchievement): Promise<CompletedAchievement> {
		await this.waitForDbInit();
		try {
			const result = await this.db.update('achievements', achievement);
			return result;
		}
		catch (e) {
			console.error('[achievements] [storage] error while saving completed achievement', e);
		}
	}

	public async getAll(): Promise<CompletedAchievement[]> {
		await this.waitForDbInit();
		try {
			const achievements: CompletedAchievement[] = await this.db.getAll('achievements');
			return achievements;
		}
		catch (e) {
			console.error('[achievements] [storage] error while getting all completed achievements', e);
		}
	}
	
	public async loadAllHistory(): Promise<AchievementHistory[]> {
		await this.waitForDbInit();
		try {
			const history = await this.db.getAll('achievement-history', null);
			return history;
		}
		catch (e) {
			console.error('[achievements] [storage] error while loading all history', e);
		}
	}
	
	public async saveHistory(history: AchievementHistory) {
		await this.waitForDbInit();
		try {
			const saved = await this.db.update('achievement-history', history);
			console.log('[achievements] [storage] saved history', saved);
		}
		catch (e) {
			console.error('[achievements] [storage] error while saving history', history, e);
		}
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
			console.log('[achievements] [storage] indexeddb upgraded');
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
}
