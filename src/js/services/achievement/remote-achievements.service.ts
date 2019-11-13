import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Achievement } from '../../models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameStateService } from '../decktracker/game-state.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { UserService } from '../user.service';
import { AchievementsLocalDbService } from './indexed-db.service';

const ACHIEVEMENTS_POST_URL = 'https://d37acgsdwl.execute-api.us-west-2.amazonaws.com/Prod/achievementstats';
const ACHIEVEMENTS_RETRIEVE_URL = ' https://mtpdm7a1e5.execute-api.us-west-2.amazonaws.com/Prod/completedAchievements';

@Injectable()
export class RemoteAchievementsService {
	// private userId: string;
	// private userMachineId: string;
	// private username: string;

	constructor(
		private logger: NGXLogger,
		private http: HttpClient,
		private indexedDb: AchievementsLocalDbService,
		private ow: OverwolfService,
		private userService: UserService,
		private gameService: GameStateService,
		private prefs: PreferencesService,
	) {
		// this.events.on(Events.ACHIEVEMENT_UNLOCKED).subscribe(event => this.publishAchievementStats(event));
		// this.retrieveUserInfo();
		// this.ow.addLoginStateChangedListener(() => this.retrieveUserInfo());
	}

	public async loadAchievements(): Promise<readonly CompletedAchievement[]> {
		const prefs = this.prefs.getPreferences();
		if ((await prefs).resetAchievementsOnAppStart) {
			this.logger.debug('[remote-achievements] not loading achievements from remote - streamer mode');
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
		this.logger.debug('[remote-achievements] loading from server');
		const result = await this.loadRemoteAchievements(postEvent);
		this.logger.debug(
			'[remote-achievements] loaded from server',
			result && result.results && result.results.length,
		);

		// Update local cache
		await this.indexedDb.setAll(result.results);
		// await Promise.all(result.results.map(completedAchievement => this.indexedDb.saveAll(completedAchievement)));
		this.logger.debug('[remote-achievements] updated local cache');

		return result.results;
	}

	// TODO: at some point, use the CurrentUser from the state?
	public async publishRemoteAchievement(achievement: Achievement, retriesLeft = 15): Promise<void> {
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
			result => {},
			error => {
				console.warn('Could not upload achievemnt stats, retrying', error);
				setTimeout(() => this.publishRemoteAchievement(achievement, retriesLeft--), 3000);
			},
		);
	}

	private async loadRemoteAchievements(userInfo): Promise<{ results: readonly CompletedAchievement[] }> {
		return new Promise<{ results: readonly CompletedAchievement[] }>((resolve, reject) => {
			this.loadAchievementsInternal(userInfo, result => resolve(result));
		});
	}

	private loadAchievementsInternal(userInfo, callback, retriesLeft = 15) {
		if (retriesLeft <= 0) {
			callback([]);
			return;
		}
		this.http.post(`${ACHIEVEMENTS_RETRIEVE_URL}`, userInfo).subscribe(
			(result: any) => {
				callback(result);
			},
			error => {
				setTimeout(() => this.loadAchievementsInternal(userInfo, callback, retriesLeft - 1), 2000);
			},
		);
	}
}
