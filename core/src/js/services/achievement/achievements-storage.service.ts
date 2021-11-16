import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { CompletedAchievement } from '../../models/completed-achievement';
import { LocalStorageService } from '../local-storage';
import { HsAchievementsInfo } from './achievements-info';

declare let amplitude;

@Injectable()
export class AchievementsStorageService {
	public dbInit: boolean;

	private db: AngularIndexedDB;
	private achievementsCache: { [achievementId: string]: CompletedAchievement } = {};

	constructor(private readonly localStorageService: LocalStorageService) {
		// Necessary for history
		this.init();
	}

	public async saveInGameAchievements(info: HsAchievementsInfo): Promise<HsAchievementsInfo> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_IN_GAME_ACHIEVEMENTS, info);
		return info;
	}

	public async retrieveInGameAchievements(): Promise<HsAchievementsInfo> {
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_IN_GAME_ACHIEVEMENTS);
		if (!!fromStorage) {
			return fromStorage;
		}

		await this.waitForDbInit();
		try {
			const info = await this.db.getAll('achievements-from-game', null);
			const result = info[0] ? info[0].info : [];
			if (!!result?.length) {
				amplitude.getInstance().logEvent('load-from-indexeddb', { 'category': 'in-game-achievements' });
			}
			await this.saveInGameAchievements(info);
			return result;
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

	public getAll(): readonly CompletedAchievement[] {
		return Object.values(this.achievementsCache);
	}

	public async loadAllHistory(): Promise<readonly AchievementHistory[]> {
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_ACHIEVEMENTS_HISTORY);
		if (!!fromStorage) {
			return fromStorage;
		}

		await this.waitForDbInit();
		try {
			const history = await this.db.getAll('achievement-history', null);
			if (!!history?.length) {
				amplitude.getInstance().logEvent('load-from-indexeddb', { 'category': 'achievements-history' });
			}
			this.saveAllHistory(history);
			return history;
		} catch (e) {
			console.error('[achievements] [storage] error while loading all history', e.message, e.name, e);
			return [];
		}
	}

	public async saveAllHistory(history: readonly AchievementHistory[]) {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_ACHIEVEMENTS_HISTORY, history);
	}

	public async saveHistory(history: AchievementHistory) {
		const fromStorage = this.localStorageService.getItem(LocalStorageService.LOCAL_STORAGE_ACHIEVEMENTS_HISTORY);
		const historyList: readonly AchievementHistory[] = fromStorage ?? [];
		const newHistory = [history, ...historyList];
		this.saveAllHistory(newHistory);
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
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
