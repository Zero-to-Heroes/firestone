import { Injectable } from '@angular/core';

import { GameEvent } from '../../models/game-event';
import { CompletedAchievement } from '../../models/completed-achievement';

import { AchievementsRefereee } from './achievements-referee.service';
import { AchievementsRepository } from './achievements-repository.service';

import { Events } from '../events.service';
import { GameEvents } from '../game-events.service';
import { AchievementHistoryStorageService } from './achievement-history-storage.service';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { OwNotificationsService } from '../notifications.service';
import { Achievement } from 'src/js/models/achievement';
import { AchievementNameService } from './achievement-name.service';
import { AchievementsStorageService } from './achievements-storage.service';
import { ReplayInfo } from 'src/js/models/replay-info';
import { Challenge } from './achievements/challenge';
import { FeatureFlags } from '../feature-flags.service';
import { AchievementConfService } from './achievement-conf.service';

declare var ga;
declare var overwolf;

@Injectable()
export class AchievementsMonitor {

	private collectionWindowId: string;

	constructor(
		private gameEvents: GameEvents,
		private notificationService: OwNotificationsService,
		private nameService: AchievementNameService,
		private achievementsReferee: AchievementsRefereee,
		private achievementStorage: AchievementsStorageService,
		private storage: AchievementHistoryStorageService,
		private conf: AchievementConfService,
		private repository: AchievementsRepository,
		private flags: FeatureFlags,
		private events: Events) {

		this.gameEvents.allEvents.subscribe(
			(gameEvent: GameEvent) => {
				this.handleEvent(gameEvent);
			}
		);
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
			this.collectionWindowId = result.window.id;
		});
		this.events.on(Events.ACHIEVEMENT_RECORD_STARTED).subscribe((data) => this.handleAchievementRecordStarted(data));
		this.events.on(Events.ACHIEVEMENT_RECORDED).subscribe((data) => this.handleAchievementRecordCompleted(data));
		console.log('listening for achievement completion events');
	}

	public sendPreRecordNotification(achievement: Achievement, notificationTimeout: number) {
		const text = this.nameService.displayName(achievement.id);
		console.log('sending new notification', text);
		this.notificationService.html({
			// The achievement.id is used in the notification service to uniquely get the right notification
			// HTML element
			content: `
				<div class="achievement-message-container ${achievement.id} unclickable">
					<div class="achievement-image-container">
						<img 
							src="http://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.cardId}.jpg"
							class="real-achievement"/>
						<i class="i-84x90 frame">
							<svg>
								<use xlink:href="/Files/assets/svg/sprite.svg#achievement_frame"/>
							</svg>
						</i>
					</div>
					<div class="message">
						<div class="title">
							<i class="icon-svg">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#${this.conf.icon(achievement.type)}"/>
								</svg>
							</i>
							<span>Achievement unlocked!</span>
						</div>
						<span class="text">${text}</span>
						<div class="recap-text">
							<span class="pending">Your replay is being recorded...<span class="loader"></span></span>
							<span class="active">Replay saved! Click to recap</span>
						</div>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			type: 'achievement-pre-record',
			cardId: achievement.id,
			timeout: notificationTimeout,
		});
	}

	public sendPostRecordNotification(achievement: Achievement) {
		// In case the pre-record notification has already timed out, we need to send a full notif
		const text = this.nameService.displayName(achievement.id);
		this.notificationService.html({
			content: `
			<div class="achievement-message-container ${achievement.id}">
				<div class="achievement-image-container">
					<img 
						src="http://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.cardId}.jpg"
						class="real-achievement"/>
					<i class="i-84x90 frame">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#achievement_frame"/>
						</svg>
					</i>
				</div>
				<div class="message">
					<div class="title">
						<i class="icon-svg">
							<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#${this.conf.icon(achievement.type)}"/>
							</svg>
						</i>
						<span>Achievement unlocked!</span>
					</div>
					<span class="text">${text}</span>
					<div class="recap-text">
						<span>Replay saved! Click to recap</span>
					</div>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`,
			theClass: 'active',
			type: 'achievement-confirm',
			cardId: achievement.id
		});
	}

	public storeNewAchievementHistory(achievement: Achievement, numberOfCompletions: number) {
		this.storage.save(new AchievementHistory(
			achievement.id, 
			achievement.name, 
			numberOfCompletions, 
			achievement.difficulty));
	}

	private async handleAchievementRecordStarted(data) {
		// const achievementId: string = data.data[0];
		// const achievement: CompletedAchievement = await this.achievementStorage.loadAchievement(achievementId);
		// const achievementReplayInfo = (achievement.replayInfo || []);
		// console.log('processing tmp achievement', data, achievement, achievementReplayInfo);
		// // This happens if app is killed before we can save
		// if (achievementReplayInfo.length === 0 || achievementReplayInfo[0].url !== 'tmp') {
		// 	const replayInfo: ReplayInfo = {
		// 		url: 'tmp',
		// 		creationTimestamp: undefined,
		// 		path: undefined,
		// 		thumbnailPath: undefined,
		// 		thumbnailUrl: undefined,
		// 		achievementStepId: achievementId,
		// 	};
		// 	const newAchievement = new CompletedAchievement(
		// 			achievement.id,
		// 			achievement.numberOfCompletions,
		// 			[replayInfo, ...achievementReplayInfo]);
		// 	const result = await this.achievementStorage.saveAchievement(newAchievement);
		// 	console.log('[recording] saved new tmp achievement recording', result);
		// }
	}

	private async handleAchievementRecordCompleted(data) {
		const achievementId: string = data.data[0];
		const replayInfo: ReplayInfo = data.data[1];
		const achievement: CompletedAchievement = await this.achievementStorage.loadAchievement(achievementId);
		// const realReplayInfo = achievement.replayInfo.slice(1, achievement.replayInfo.length);
		// console.log('after tmp removal', realReplayInfo, achievement.replayInfo);
		const newAchievement = new CompletedAchievement(
				achievement.id,
				achievement.numberOfCompletions,
				[replayInfo, ...achievement.replayInfo]);
		console.log('[recording] saving new achievement', newAchievement);
		const result = await this.achievementStorage.saveAchievement(newAchievement)
		console.log('[recording] saved new achievement', result);
		overwolf.windows.sendMessage(this.collectionWindowId, 'achievement-save-complete', newAchievement.id, () => {});

		if (newAchievement.numberOfCompletions == 1 && this.flags.achievements()) {
			const achievement: Achievement = this.repository.getAllAchievements()
				.filter((ach) => ach.id == newAchievement.id)
				[0];
			this.sendPostRecordNotification(achievement)
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		// console.log('[achievements] handling events', gameEvent);
		for (let challenge of this.repository.challengeModules) {
			challenge.detect(gameEvent, (data) => {
				// console.log('[achievements] challenge completed', gameEvent, data, challenge);
				this.achievementsReferee.complete(challenge, (newAchievement) => {
					this.completeAchievement(newAchievement, challenge);
				}, data);
			});
		}
	}

	private completeAchievement(newAchievement: CompletedAchievement, challenge: Challenge) {
		// console.log('[achievements] WOOOOOOHOOOOOOOOO!!!! New achievement!', newAchievement);
		ga('send', 'event', 'new-achievement', newAchievement.id);
		this.events.broadcast(Events.NEW_ACHIEVEMENT, newAchievement);
		const achievement: Achievement = this.repository.getAllAchievements()
			.filter((ach) => ach.id == newAchievement.id)
			[0];
		// We store an history item every time, but we display only the first time an achievement is unlocked
		this.storeNewAchievementHistory(achievement, newAchievement.numberOfCompletions);
		this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, achievement, newAchievement.numberOfCompletions, challenge);
		if (newAchievement.numberOfCompletions == 1 && this.flags.achievements()) {
			this.sendPreRecordNotification(achievement, challenge.notificationTimeout());
		}
	}
}
