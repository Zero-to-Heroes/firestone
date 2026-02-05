import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject, sortByProperties } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { Achievement } from '../models/achievement';
import { AchievementHistory } from '../models/achievement-history';
import { AchievementHistoryStorageService } from './achievement-history-storage.service';
import { RawAchievementsLoaderService } from './raw-achievements-loader.service';

@Injectable()
export class AchievementHistoryService extends AbstractFacadeService<AchievementHistoryService> {
	public achievementsHistory$$: SubscriberAwareBehaviorSubject<readonly AchievementHistory[]>;

	private achievementHistoryStorage: AchievementHistoryStorageService;
	private achievementsLoader: RawAchievementsLoaderService;

	constructor(windowManager: WindowManagerService) {
		super(windowManager, 'AchievementHistoryService', () => !!this.achievementsHistory$$);
	}

	protected assignSubjects(): void {
		this.achievementsHistory$$ = this.mainInstance.achievementsHistory$$;
	}

	protected async init() {
		this.achievementsHistory$$ = new SubscriberAwareBehaviorSubject<readonly AchievementHistory[]>([]);
		this.achievementHistoryStorage = AppInjector.get(AchievementHistoryStorageService);
		this.achievementsLoader = AppInjector.get(RawAchievementsLoaderService);

		this.achievementsHistory$$.onFirstSubscribe(async () => {
			this.achievementsHistory$$.subscribe((history) => this.achievementHistoryStorage.saveAll(history));

			const initialHistory = await this.loadInitialHistory();
			console.log('[achievements-history] loaded initial history', initialHistory.length);
			this.achievementsHistory$$.next(initialHistory);
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.achievementsHistory$$, 'AchievementHistoryService-achievementsHistory');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.achievementsHistory$$ = new SubscriberAwareBehaviorSubject<readonly AchievementHistory[]>([]);
	}

	public async addHistoryItem(achievement: Achievement) {
		const historyItem = {
			achievementId: achievement.id,
			achievementName: achievement.name,
			numberOfCompletions: achievement.numberOfCompletions,
			difficulty: achievement.difficulty,
			creationTimestamp: Date.now(),
			displayName: achievement.displayName,
		} as AchievementHistory;
		console.debug('[achievements-history] saving history item', historyItem.achievementId);
		const existingHistory = (await this.achievementsHistory$$.getValueWithInit()) ?? [];
		const newHistory = [historyItem, ...existingHistory];
		this.achievementsHistory$$.next(newHistory);
	}

	private async loadInitialHistory(): Promise<readonly AchievementHistory[]> {
		// TODO: also load the HS achievement history, in addition to the Firestone one
		// TODO: load the history from remote as well as from local

		const [history, achievements] = await Promise.all([
			this.achievementHistoryStorage.loadAll(),
			this.achievementsLoader.loadRawAchievements(),
		]);
		return (
			history
				.filter((history) => history.numberOfCompletions === 1)
				.map((history) => {
					const matchingAchievement = achievements.find((ach) => ach.id === history.achievementId);
					// This can happen with older history items
					if (!matchingAchievement) {
						return null;
					}
					return {
						...history,
						displayName: achievements.find((ach) => ach.id === history.achievementId)?.displayName,
					} as AchievementHistory;
				})
				.filter((history) => history)
				// We want to have the most recent at the top
				.sort(sortByProperties((a) => [-a!.creationTimestamp])) as readonly AchievementHistory[]
		);
	}
}
