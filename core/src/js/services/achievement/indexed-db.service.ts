import { Injectable } from '@angular/core';
import { AngularIndexedDB } from 'angular2-indexeddb';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { CompletedAchievement } from '../../models/completed-achievement';
import { ReplayInfo } from '../../models/replay-info';

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
		const achievement =
			this.achievementsCache[achievementId] ||
			CompletedAchievement.create({
				id: achievementId,
				numberOfCompletions: 0,
				replayInfo: [] as readonly ReplayInfo[],
			} as CompletedAchievement);
		const replayInfo = await this.loadReplayInfo(achievementId);
		return achievement.update({
			replayInfo: replayInfo,
		} as CompletedAchievement);
		// await this.waitForDbInit();
		// try {
		// 	const achievement = await this.db.getByKey('achievements', achievementId);
		// 	return achievement;
		// } catch (e) {
		// 	console.error('[achievements] [storage] error while loading completed achievement', e.message, e.name, e);
		// }
	}

	private async loadReplayInfo(achievementId: string): Promise<readonly ReplayInfo[]> {
		await this.waitForDbInit();
		try {
			return ((await this.db.getByKey('achievements-replay-info', achievementId)) || ({} as CompletedAchievement))
				.replayInfo;
		} catch (e) {
			console.error('[achievements] [storage] error while loading replay-info', e.message, e.name, e);
		}
	}

	public async save(achievement: CompletedAchievement): Promise<CompletedAchievement> {
		this.achievementsCache[achievement.id] = achievement;
		if (achievement.replayInfo && achievement.replayInfo.length > 0) {
			await this.saveReplayInfo(achievement.id, achievement.replayInfo);
		}
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

	private async saveReplayInfo(achievementId: string, replayInfo: readonly ReplayInfo[]) {
		await this.waitForDbInit();
		try {
			const replayInfoData = {
				id: achievementId,
				replayInfo: replayInfo,
			} as CompletedAchievement;
			const result = await this.db.update('achievements-replay-info', replayInfoData);
			return result;
		} catch (e) {
			console.error(
				'[achievements] [storage] error while saving achievements-replay-info',
				achievementId,
				replayInfo,
				e.message,
				e.name,
				e,
			);
			return [];
		}
	}

	// public async saveAll(achievements: readonly CompletedAchievement[]): Promise<readonly CompletedAchievement[]> {
	// 	if (!achievements) {
	// 		return [];
	// 	}
	// 	achievements.forEach(achievement => this.save(achievement));
	// 	return this.getAll();
	// }

	public async setAll(achievements: readonly CompletedAchievement[]): Promise<readonly CompletedAchievement[]> {
		if (!achievements) {
			return [];
		}
		this.achievementsCache = {};
		achievements.forEach(achievement => this.save(achievement));
		return this.getAll();
	}

	public async getAll(): Promise<CompletedAchievement[]> {
		const replayInfos = await this.getAllReplayInfo();
		return Object.values(this.achievementsCache).map(ach => {
			const replays = replayInfos.find(info => info.id === ach.id);
			return replays ? ach.update({ replayInfo: replays.replayInfo } as CompletedAchievement) : ach;
		});
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

	public async getAllReplayInfo(): Promise<readonly CompletedAchievement[]> {
		await this.waitForDbInit();
		try {
			return await this.db.getAll('achievements-replay-info', null);
		} catch (e) {
			console.error(
				'[achievements] [storage] error while getting all achievements-replay-info',
				e.message,
				e.name,
				e,
			);
			return [];
		}
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
			.openDatabase(3, evt => {
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
				if (evt.oldVersion < 3) {
					console.log('[achievements] [storage] upgrade to version 3');
					evt.currentTarget.result.createObjectStore('achievements-replay-info', {
						keyPath: 'id',
						autoIncrement: false,
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
