import { Injectable } from '@angular/core';
import { HsAchievementsInfo } from '@firestone/memory';
import { LocalStorageService } from '@firestone/shared/framework/core';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { CompletedAchievement } from '../../models/completed-achievement';

@Injectable()
export class AchievementsStorageService {
	private achievementsCache: { [achievementId: string]: CompletedAchievement } = {};

	constructor(private readonly localStorageService: LocalStorageService) {}

	public async saveInGameAchievements(info: HsAchievementsInfo): Promise<HsAchievementsInfo> {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_IN_GAME_ACHIEVEMENTS, info);
		return info;
	}

	public async retrieveInGameAchievements(): Promise<HsAchievementsInfo> {
		console.debug('[achievements-storage] retrieving in-game achievements');
		const fromStorage = this.localStorageService.getItem<HsAchievementsInfo>(
			LocalStorageService.LOCAL_STORAGE_IN_GAME_ACHIEVEMENTS,
		);
		return fromStorage;
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
		const fromStorage = this.localStorageService.getItem<readonly AchievementHistory[]>(
			LocalStorageService.LOCAL_STORAGE_ACHIEVEMENTS_HISTORY,
		);
		return fromStorage ?? [];
	}

	public async saveAllHistory(history: readonly AchievementHistory[]) {
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_ACHIEVEMENTS_HISTORY, history);
	}
}
