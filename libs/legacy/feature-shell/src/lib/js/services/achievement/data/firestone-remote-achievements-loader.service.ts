import { Injectable } from '@angular/core';
import { ApiRunner, LocalStorageService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { Achievement } from '../../../models/achievement';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameStateService } from '../../decktracker/game-state.service';
import { UserService } from '../../user.service';

const ACHIEVEMENTS_UPDATE_URL = 'https://yl2slri7psjvyzqscikel2cfgi0hlesx.lambda-url.us-west-2.on.aws/';
const ACHIEVEMENTS_RETRIEVE_URL = 'https://v4sa2mtlxy5y5suuwwmj6p2i6e0epbqt.lambda-url.us-west-2.on.aws/';

// This is only used for Firestone achievements - the native achievements are retrieved from memory
@Injectable()
export class FirestoneRemoteAchievementsLoaderService {
	public remoteAchievements$$ = new BehaviorSubject<readonly CompletedAchievement[]>([]);

	constructor(
		private readonly api: ApiRunner,
		private readonly userService: UserService,
		private readonly gameService: GameStateService,
		private readonly localStorage: LocalStorageService,
	) {}

	public async loadAchievements() {
		const localResult = this.localStorage.getItem<LocalRemoteAchievements>(
			LocalStorageService.ACHIEVEMENTS_USER_COMPLETED,
		);
		if (!!localResult?.achievements?.length) {
			console.debug('[achievements] loading achievements from local storage', localResult.achievements);
			this.remoteAchievements$$.next(localResult.achievements);
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
		console.debug('[achievements] loading achievements from remote', newResult?.achievements);
		if (!!newResult?.achievements?.length) {
			this.localStorage.setItem(LocalStorageService.ACHIEVEMENTS_USER_COMPLETED, newResult);
			this.remoteAchievements$$.next(newResult.achievements);
		}
	}

	public async publishRemoteAchievement(achievement: Achievement): Promise<void> {
		const [currentUser, reviewId] = await Promise.all([
			this.userService.getCurrentUser(),
			this.gameService.getCurrentReviewId(),
		]);
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
		this.updateCompletedAchievements(achievement);
	}

	private updateCompletedAchievements(achievement: Achievement) {
		const newCompletedAchievements = [
			CompletedAchievement.create({
				id: achievement.id,
				numberOfCompletions: 1,
			}),
			...(this.remoteAchievements$$.value ?? []),
		];
		this.remoteAchievements$$.next(newCompletedAchievements);
		const newLocalResult: LocalRemoteAchievements = {
			lastUpdateDate: new Date(),
			achievements: newCompletedAchievements,
		};
		this.localStorage.setItem(LocalStorageService.ACHIEVEMENTS_USER_COMPLETED, newLocalResult);
	}
}

interface LocalRemoteAchievements {
	readonly lastUpdateDate: Date;
	readonly achievements: readonly CompletedAchievement[];
}
