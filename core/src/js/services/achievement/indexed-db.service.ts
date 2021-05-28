import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { CompletedAchievement } from '../../models/completed-achievement';
import { HsAchievementsInfo } from './achievements-info';

@Injectable()
export class AchievementsLocalDbService {
	public dbInit: boolean;

	private db: AngularIndexedDB;
	private achievementsCache: { [achievementId: string]: CompletedAchievement } = {};

	constructor() {
		// Necessary for history
		this.init();
	}

	public async saveInGameAchievements(info: HsAchievementsInfo): Promise<HsAchievementsInfo> {
		await this.waitForDbInit();
		const dbInfo = {
			id: 1,
			info: info,
		};
		return new Promise<HsAchievementsInfo>((resolve) => {
			this.saveInGameAchievementsInternal(dbInfo, (result) => resolve(result));
		});
	}

	private async saveInGameAchievementsInternal(dbInfo, callback, retriesLeft = 10) {
		if (retriesLeft <= 0) {
			console.error('[achievements] [storage] could not update achievements-from-game');
			callback(dbInfo.info);
			return;
		}
		try {
			await this.db.update('achievements-from-game', dbInfo);
			callback(dbInfo.info);
			return;
		} catch (e) {
			console.warn('[achievements] [storage] could not update achievements-from-game', e.message, e.name, e);
			setTimeout(() => this.saveInGameAchievementsInternal(dbInfo, callback, retriesLeft - 1));
		}
	}

	public async retrieveInGameAchievements(): Promise<HsAchievementsInfo> {
		await this.waitForDbInit();
		try {
			const info = await this.db.getAll('achievements-from-game', null);
			return info[0] ? info[0].info : [];
		} catch (e) {
			console.error('[achievements] [storage] could not get achievements-from-game', e.message, e.name, e);
		}
	}

	public save(achievement: CompletedAchievement): CompletedAchievement {
		this.achievementsCache[achievement.id] = achievement;
		return achievement;
	}

	public setAll(achievements: readonly CompletedAchievement[]): readonly CompletedAchievement[] {
		if (!achievements) {
			return [];
		}
		this.achievementsCache = {};
		[...achievements].forEach((achievement) => this.save(achievement));
		return this.getAll();
	}

	public getAchievement(achievementId: string): CompletedAchievement {
		const achievement =
			this.achievementsCache[achievementId] ||
			CompletedAchievement.create({
				id: achievementId,
				numberOfCompletions: 0,
			} as CompletedAchievement);
		return achievement;
	}

	public getAll(): CompletedAchievement[] {
		return Object.values(this.achievementsCache);
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
		this.db = new AngularIndexedDB('hs-achievements-db', 4);
		this.db
			.openDatabase(4, (evt) => {
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
				if (evt.oldVersion < 4) {
					console.log('[achievements] [storage] upgrade to version 4');
					evt.currentTarget.result.createObjectStore('achievements-from-game', {
						keyPath: 'id',
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
				(e) => {
					console.log('[achievements] [storage] error in openDatabase', e.message, e.name, e);
				},
			);
	}

	private waitForDbInit(): Promise<void> {
		return new Promise<void>((resolve) => {
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
