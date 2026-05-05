import { Injectable } from '@angular/core';
import { ReviewIdService } from '@firestone/game-state';
import { DiskCacheService } from '@firestone/shared/common/service';
import { ApiRunner, UserService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { Achievement } from '../models/achievement';
import { CompletedAchievement } from '../models/completed-achievement';
import { IRemoteAchievementsService } from './remote-achievements-service.interface';

const ACHIEVEMENTS_UPDATE_URL = 'https://yl2slri7psjvyzqscikel2cfgi0hlesx.lambda-url.us-west-2.on.aws/';
const ACHIEVEMENTS_RETRIEVE_URL = 'https://v4sa2mtlxy5y5suuwwmj6p2i6e0epbqt.lambda-url.us-west-2.on.aws/';

// This is only used for Firestone achievements - the native achievements are retrieved from memory
@Injectable()
export class FirestoneRemoteAchievementsLoaderService implements IRemoteAchievementsService {
	public remoteAchievements$$ = new BehaviorSubject<readonly CompletedAchievement[]>([]);

	constructor(
		private readonly api: ApiRunner,
		private readonly userService: UserService,
		private readonly reviewIdService: ReviewIdService,
		private readonly diskCache: DiskCacheService,
	) {}

	public async loadAchievements() {
		const localResult = await this.diskCache.getItem<LocalRemoteAchievements>(
			DiskCacheService.DISK_CACHE_KEYS.ACHIEVEMENTS_USER_COMPLETED,
		);
		if (!!localResult?.achievements?.length) {
			console.debug('[achievements] loading achievements from local cache', localResult.achievements);
			this.remoteAchievements$$.next(localResult.achievements);
			return;
		}

		const currentUser = await this.userService.getCurrentUser();
		if (!currentUser) {
			return;
		}

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
		console.debug('[achievements] loading achievements from remote', newResult?.achievements);
		if (!!newResult?.achievements?.length) {
			this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.ACHIEVEMENTS_USER_COMPLETED, newResult);
			this.remoteAchievements$$.next(newResult.achievements);
		}
	}

	public async publishRemoteAchievement(achievement: Achievement): Promise<void> {
		const currentUser = await this.userService.getCurrentUser();
		const reviewId = this.reviewIdService.reviewId$$.value;
		if (currentUser) {
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
		} else {
			console.debug(
				'[achievements] skip remote POST (no user); updating local completion stream only',
				achievement.id,
			);
		}
		this.updateCompletedAchievements(achievement);
	}

	private updateCompletedAchievements(achievement: Achievement) {
		const completions = achievement.numberOfCompletions ?? 1;
		const entry = CompletedAchievement.create({
			id: achievement.id,
			numberOfCompletions: completions,
		});
		const previous = this.remoteAchievements$$.value ?? [];
		const withoutSameId = previous.filter((c) => c.id !== achievement.id);
		const newCompletedAchievements = [entry, ...withoutSameId];
		this.remoteAchievements$$.next(newCompletedAchievements);
		const newLocalResult: LocalRemoteAchievements = {
			lastUpdateDate: new Date(),
			achievements: newCompletedAchievements,
		};
		this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.ACHIEVEMENTS_USER_COMPLETED, newLocalResult);
	}
}

interface LocalRemoteAchievements {
	readonly lastUpdateDate: Date;
	readonly achievements: readonly CompletedAchievement[];
}
