import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { CompletedAchievement } from '../../models/completed-achievement';

@Injectable()
export class AchievementsLocalDbService {
	public dbInit: boolean;

	private db: AngularIndexedDB;
	private achievementsCache: { [achievementId: string]: CompletedAchievement } = {};

	constructor() {
		// Necessary for history
		this.init();
	}

	public async getAchievement(achievementId: string): Promise<CompletedAchievement> {
		return this.achievementsCache[achievementId];
		// await this.waitForDbInit();
		// try {
		// 	const achievement = await this.db.getByKey('achievements', achievementId);
		// 	return achievement;
		// } catch (e) {
		// 	console.error('[achievements] [storage] error while loading completed achievement', e.message, e.name, e);
		// }
	}

	public async save(achievement: CompletedAchievement): Promise<CompletedAchievement> {
		this.achievementsCache[achievement.id] = achievement;
		return achievement;
		// await this.waitForDbInit();
		// try {
		// 	const result = await this.db.update('achievements', achievement);
		// 	return result;
		// } catch (e) {
		// 	console.error(
		// 		'[achievements] [storage] error while saving completed achievement',
		// 		achievement,
		// 		e.message,
		// 		e.name,
		// 		e,
		// 	);
		// 	return achievement;
		// }
	}

	public async saveAll(achievements: readonly CompletedAchievement[]): Promise<readonly CompletedAchievement[]> {
		if (!achievements) {
			return [];
		}
		achievements.forEach(achievement => this.save(achievement));
		return this.getAll();
	}

	public async getAll(): Promise<CompletedAchievement[]> {
		return Object.values(this.achievementsCache);
		// await this.waitForDbInit();
		// try {
		// 	const achievements: CompletedAchievement[] = await this.db.getAll('achievements');
		// 	return achievements;
		// } catch (e) {
		// 	console.error(
		// 		'[achievements] [storage] error while getting all completed achievements',
		// 		e.message,
		// 		e.name,
		// 		e,
		// 	);
		// 	return [];
		// }
	}

	public async loadAllHistory(): Promise<AchievementHistory[]> {
		await this.waitForDbInit();
		try {
			const history = await this.db.getAll('achievement-history', null);
			return history;
		} catch (e) {
			console.error('[achievements] [storage] error while loading all history', e.message, e.name, e);
			return [];
		}
	}

	public async saveHistory(history: AchievementHistory) {
		await this.waitForDbInit();
		try {
			const saved = await this.db.update('achievement-history', history);
			console.log('[achievements] [storage] saved history', saved);
		} catch (e) {
			console.error('[achievements] [storage] error while saving history', e.message, e.name, history, e);
		}
	}

	private init() {
		console.log('[achievements] [storage] starting init of indexeddb');
		this.db = new AngularIndexedDB('hs-achievements-db', 2);
		this.db
			.openDatabase(2, evt => {
				console.log('[achievements] [storage] opendb successful', evt);
				if (evt.oldVersion < 1) {
					console.log('[achievements] [storage] creating achievements store');
					evt.currentTarget.result.createObjectStore('achievements', { keyPath: 'id' });
				}
				if (evt.oldVersion < 2) {
					console.log('[achievements] [storage] upgrade to version 2');
					evt.currentTarget.result.createObjectStore('achievement-history', {
						keyPath: 'id',
						autoIncrement: true,
					});
				}
				console.log('[achievements] [storage] indexeddb upgraded');
				this.dbInit = true;
			})
			.then(
				() => {
					console.log('[achievements] [storage] openDatabase successful', this.db.dbWrapper.dbName);
					this.dbInit = true;
				},
				e => {
					console.log('[achievements] [storage] error in openDatabase', e.message, e.name, e);
				},
			);
	}

	private waitForDbInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				if (this.dbInit) {
					resolve();
				} else {
					// console.log('[achievements] [storage] waiting for init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
