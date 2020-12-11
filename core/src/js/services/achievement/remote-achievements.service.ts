import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Achievement } from '../../models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameStateService } from '../decktracker/game-state.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { UserService } from '../user.service';
import { AchievementsManager } from './achievements-manager.service';
import { AchievementsLocalDbService } from './indexed-db.service';

const ACHIEVEMENTS_POST_URL = 'https://d37acgsdwl.execute-api.us-west-2.amazonaws.com/Prod/achievementstats';
const ACHIEVEMENTS_RETRIEVE_URL = ' https://mtpdm7a1e5.execute-api.us-west-2.amazonaws.com/Prod/completedAchievements';

@Injectable()
export class RemoteAchievementsService {
	private completedAchievementsFromRemote: readonly CompletedAchievement[];

	constructor(
		private http: HttpClient,
		private indexedDb: AchievementsLocalDbService,
		private ow: OverwolfService,
		private manager: AchievementsManager,
		private userService: UserService,
		private gameService: GameStateService,
		private prefs: PreferencesService,
	) {}

	public async loadAchievements(): Promise<readonly CompletedAchievement[]> {
		const prefs = this.prefs.getPreferences();
		if (process.env.NODE_ENV !== 'production' && (await prefs).resetAchievementsOnAppStart) {
			console.log('[remote-achievements] not loading achievements from remote - streamer mode');
			await this.indexedDb.setAll([]);
			return [];
		}
		const currentUser = await this.userService.getCurrentUser();
		// Load from remote
		const postEvent = {
			userName: currentUser.username,
			userId: currentUser.userId,
			machineId: currentUser.machineId,
		};
		console.log('[remote-achievements] loading from server');
		const [achievementsFromRemote, achievementsFromMemory] = await Promise.all([
			this.loadRemoteAchievements(postEvent),
			this.manager.getAchievements(),
		]);
		console.log('[remote-achievements] loaded', achievementsFromRemote.length, achievementsFromMemory.length);
		if (!achievementsFromRemote.length && !achievementsFromMemory.length) {
			return [];
		}

		// Update local cache
		const completedAchievementsFromRemote = achievementsFromRemote.map(ach => CompletedAchievement.create(ach));
		this.completedAchievementsFromRemote = completedAchievementsFromRemote;
		const completedAchievementsFromMemory = achievementsFromMemory.map(ach =>
			CompletedAchievement.create({
				id: `hearthstone_game_${ach.id}`,
				numberOfCompletions: ach.completed ? 1 : 0,
			} as CompletedAchievement),
		);
		const achievements = [...completedAchievementsFromRemote, ...completedAchievementsFromMemory];
		await this.indexedDb.setAll(achievements);
		console.log('[remote-achievements] updated local cache');
		return achievements;
	}

	public async reloadFromMemory(): Promise<readonly CompletedAchievement[]> {
		const prefs = this.prefs.getPreferences();
		if (process.env.NODE_ENV !== 'production' && (await prefs).resetAchievementsOnAppStart) {
			console.log('[remote-achievements] not loading achievements from remote - streamer mode');
			await this.indexedDb.setAll([]);
			return [];
		}

		const achievementsFromMemory = await this.manager.getAchievements();
		const completedAchievementsFromMemory = achievementsFromMemory.map(ach =>
			CompletedAchievement.create({
				id: `hearthstone_game_${ach.id}`,
				numberOfCompletions: ach.completed ? 1 : 0,
			} as CompletedAchievement),
		);
		const achievements = [...this.completedAchievementsFromRemote, ...completedAchievementsFromMemory];
		await this.indexedDb.setAll(achievements);
		console.log('[remote-achievements] re-updated local cache');
		return achievements;
	}

	public async publishRemoteAchievement(achievement: Achievement, retriesLeft = 5): Promise<void> {
		if (retriesLeft <= 0) {
			console.error('Could not upload achievemnt stats after 15 retries');
			return;
		}
		const [currentUser, reviewId] = await Promise.all([
			this.userService.getCurrentUser(),
			this.gameService.getCurrentReviewId(),
		]);
		// const achievement: Achievement = event.data[0];
		const statEvent = {
			'creationDate': new Date(),
			'reviewId': reviewId,
			'userId': currentUser.userId,
			'userMachineId': currentUser.machineId,
			'userName': currentUser.username,
			'achievementId': achievement.id,
			'name': achievement.name,
			'type': achievement.type,
			'cardId': achievement.displayCardId,
			'numberOfCompletions': achievement.numberOfCompletions,
		};
		// console.log('saving achievement to RDS', achievement, completedAchievement, statEvent);
		this.http.post(ACHIEVEMENTS_POST_URL, statEvent).subscribe(
			result => {
				// Do nothing
			},
			error => {
				console.warn('Could not upload achievemnt stats, retrying', error);
				setTimeout(() => this.publishRemoteAchievement(achievement, retriesLeft - 1), 3000);
			},
		);
	}

	private async loadRemoteAchievements(userInfo): Promise<readonly CompletedAchievement[]> {
		return new Promise<readonly CompletedAchievement[]>((resolve, reject) => {
			this.loadAchievementsInternal(userInfo, result => resolve(result?.results || []));
		});
	}

	private loadAchievementsInternal(userInfo, callback, retriesLeft = 5) {
		if (retriesLeft <= 0) {
			console.error('Could not load achievements', `${ACHIEVEMENTS_RETRIEVE_URL}`, userInfo);
			callback([]);
			return;
		}
		this.http.post(`${ACHIEVEMENTS_RETRIEVE_URL}`, userInfo).subscribe(
			(result: any) => {
				callback(result);
			},
			error => {
				setTimeout(() => this.loadAchievementsInternal(userInfo, callback, retriesLeft - 1), 1000);
			},
		);
	}
}
