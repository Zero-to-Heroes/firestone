import { Injectable } from '@angular/core';
import {
	AchievementsRefLoaderService,
	HsRefAchiementsData,
	HsRefAchievement,
} from '@firestone/achievements/data-access';
import { ApiRunner, LocalStorageService } from '@firestone/shared/framework/core';
import { lastValueFrom } from 'rxjs';
import { Achievement } from '../../models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameStateService } from '../decktracker/game-state.service';
import { AchievementsFullUpdatedEvent } from '../mainwindow/store/events/achievements/achievements-full-updated-event';
import { PreferencesService } from '../preferences.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { UserService } from '../user.service';
import { AchievementsManager } from './achievements-manager.service';
import { AchievementsStorageService } from './achievements-storage.service';

const ACHIEVEMENTS_UPDATE_URL = 'https://yl2slri7psjvyzqscikel2cfgi0hlesx.lambda-url.us-west-2.on.aws/';
const ACHIEVEMENTS_RETRIEVE_URL = 'https://v4sa2mtlxy5y5suuwwmj6p2i6e0epbqt.lambda-url.us-west-2.on.aws/';

@Injectable()
export class RemoteAchievementsService {
	// private completedAchievementsFromRemote: readonly CompletedAchievement[] = [];

	constructor(
		private api: ApiRunner,
		private storage: AchievementsStorageService,
		private manager: AchievementsManager,
		private userService: UserService,
		private gameService: GameStateService,
		private prefs: PreferencesService,
		private readonly localStorage: LocalStorageService,
		private readonly store: AppUiStoreFacadeService,
		private readonly refLoaderService: AchievementsRefLoaderService,
	) {}

	public async loadAchievements(): Promise<readonly CompletedAchievement[]> {
		const prefs = this.prefs.getPreferences();
		if (process.env.NODE_ENV !== 'production' && (await prefs).resetAchievementsOnAppStart) {
			console.log('[remote-achievements] not loading achievements from remote - streamer mode');
			this.storage.setAll([]);
			return [];
		}
		console.log('[remote-achievements] loading from server');
		const [achievementsFromRemote, achievementsFromMemory] = await Promise.all([
			this.loadRemoteAchievements(),
			this.manager.getAchievements(),
		]);
		console.log('[remote-achievements] loaded', achievementsFromRemote.length, achievementsFromMemory.length);
		if (!achievementsFromRemote.length && !achievementsFromMemory.length) {
			return [];
		}

		// Update local cache
		const completedAchievementsFromRemote = achievementsFromRemote.map((ach) => CompletedAchievement.create(ach));
		// this.completedAchievementsFromRemote = completedAchievementsFromRemote;
		const completedAchievementsFromMemory = achievementsFromMemory.map((ach) =>
			CompletedAchievement.create({
				id: `hearthstone_game_${ach.id}`,
				numberOfCompletions: ach.completed ? 1 : 0,
			} as CompletedAchievement),
		);
		const achievements = [...completedAchievementsFromRemote, ...completedAchievementsFromMemory];
		this.storage.setAll(achievements);
		console.log('[remote-achievements] updated local cache', achievements?.length, this.storage.getAll()?.length);
		return achievements;
	}

	public async reloadFromMemory(): Promise<readonly CompletedAchievement[]> {
		const prefs = this.prefs.getPreferences();
		if (process.env.NODE_ENV !== 'production' && (await prefs).resetAchievementsOnAppStart) {
			console.log('[remote-achievements] not loading achievements from remote - streamer mode');
			this.storage.setAll([]);
			return [];
		}

		const existingAchievements = this.storage.getAll();
		const achievementsFromMemory = await this.manager.getAchievements();
		const completedAchievementsFromMemory = achievementsFromMemory.map((ach) =>
			CompletedAchievement.create({
				id: `hearthstone_game_${ach.id}`,
				numberOfCompletions: ach.completed ? 1 : 0,
			} as CompletedAchievement),
		);
		console.log(
			'[remote-achievements] laoded from memory',
			existingAchievements?.length,
			achievementsFromMemory?.length,
		);

		const existingAchievementIds = existingAchievements.map((a) => a.id);
		const achievementsFromMemoryIds = completedAchievementsFromMemory.map((a) => a.id);
		console.log(
			'[remote-achievements] mapping ids',
			existingAchievementIds?.length,
			achievementsFromMemoryIds?.length,
			// existingAchievementIds,
			// achievementsFromMemoryIds,
		);
		const allIds = [...existingAchievementIds, ...achievementsFromMemoryIds];
		console.log('[remote-achievements] all ids', allIds?.length);
		// Since when doing a reload we don't refresh the achievements from remote, we
		// need to merge the reloaded achievements with the existing cache
		const uniqueIds = [...new Set(allIds)];
		if (uniqueIds.length < achievementsFromMemory?.length) {
			console.error(
				'[remote-achievements] error while building unique Ids',
				uniqueIds.length,
				achievementsFromMemory?.length,
			);
		}
		console.log('[remote-achievements] unique Ids', uniqueIds?.length);
		const refreshedAchievements = uniqueIds.map((id) => {
			const newFromMemory = completedAchievementsFromMemory.find((a) => a.id === id);
			return newFromMemory ?? this.storage.getAchievement(id);
		});
		this.storage.setAll(refreshedAchievements);
		console.log(
			'[remote-achievements] re-updated local cache',
			refreshedAchievements?.length,
			// this.completedAchievementsFromRemote?.length,
			completedAchievementsFromMemory?.length,
			existingAchievements?.length,
		);
		return refreshedAchievements;
	}

	public async publishRemoteAchievement(achievement: Achievement): Promise<void> {
		const [currentUser, reviewId] = await Promise.all([
			this.userService.getCurrentUser(),
			this.gameService.getCurrentReviewId(),
		]);
		// const achievement: Achievement = event.data[0];
		const statEvent = {
			creationDate: new Date(),
			reviewId: reviewId,
			userId: currentUser.userId,
			userMachineId: currentUser.machineId,
			userName: currentUser.username,
			achievementId: achievement.id,
			name: achievement.name,
			type: achievement.type,
			cardId: achievement.displayCardId,
			numberOfCompletions: achievement.numberOfCompletions,
		};
		this.api.callPostApi(ACHIEVEMENTS_UPDATE_URL, statEvent);
		this.updateLocalAchievements(achievement);
	}

	// TODO: this is only used to get the quotas, so maybe expose a specific endpoint
	// for this to reduce the data transfer?
	public async loadHsRawAchievements(): Promise<readonly HsRefAchievement[]> {
		this.refLoaderService.loadRefData();
		const raw: HsRefAchiementsData = await lastValueFrom(this.refLoaderService.refData$$);
		return raw?.achievements || [];
	}

	private updateLocalAchievements(achievement: Achievement) {
		const localResult = this.localStorage.getItem<LocalRemoteAchievements>(
			LocalStorageService.ACHIEVEMENTS_USER_COMPLETED,
		);
		if (!localResult) {
			console.error('Empty local achievements');
			return;
		}

		const newAchievement: CompletedAchievement = CompletedAchievement.create({
			id: achievement.id,
			numberOfCompletions: 1,
		});
		const newResult: LocalRemoteAchievements = {
			lastUpdateDate: new Date(localResult.lastUpdateDate),
			achievements: [newAchievement, ...localResult.achievements],
		};
		this.localStorage.setItem(LocalStorageService.ACHIEVEMENTS_USER_COMPLETED, newResult);
	}

	public async loadRemoteAchievements(
		loadFromLocal = true,
		sendEvent = false,
	): Promise<readonly CompletedAchievement[]> {
		if (loadFromLocal) {
			const localResult = this.localStorage.getItem<LocalRemoteAchievements>(
				LocalStorageService.ACHIEVEMENTS_USER_COMPLETED,
			);
			// Cache the local results for 7 days
			if (localResult && Date.now() - new Date(localResult.lastUpdateDate).getTime() <= 7 * 24 * 60 * 60 * 1000) {
				return localResult.achievements;
			}
		}

		const currentUser = await this.userService.getCurrentUser();
		const userInfo = {
			userName: currentUser.username,
			userId: currentUser.userId,
			machineId: currentUser.machineId,
		};
		const remoteResult = ((await this.api.callPostApi(ACHIEVEMENTS_RETRIEVE_URL, userInfo)) as any)?.results || [];
		const newResult: LocalRemoteAchievements = {
			lastUpdateDate: new Date(),
			achievements: remoteResult,
		};
		this.localStorage.setItem(LocalStorageService.ACHIEVEMENTS_USER_COMPLETED, newResult);
		if (sendEvent) {
			this.store.send(new AchievementsFullUpdatedEvent());
		}
		return newResult.achievements;
	}
}

interface LocalRemoteAchievements {
	readonly lastUpdateDate: Date;
	readonly achievements: readonly CompletedAchievement[];
}
