import { Injectable, EventEmitter } from '@angular/core';

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

declare var ga;
declare var overwolf;

@Injectable()
export class AchievementsMonitor {

	private newAchievements = new EventEmitter<CompletedAchievement>();
	private collectionWindowId: string;

	constructor(
		private gameEvents: GameEvents,
		private notificationService: OwNotificationsService,
		private nameService: AchievementNameService,
		private achievementsReferee: AchievementsRefereee,
		private achievementStorage: AchievementsStorageService,
		private storage: AchievementHistoryStorageService,
		private repository: AchievementsRepository,
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
		this.newAchievements.subscribe(
			(newAchievement: CompletedAchievement) => {
				// console.log('[achievements] WOOOOOOHOOOOOOOOO!!!! New achievement!', newAchievement);
				ga('send', 'event', 'new-achievement', newAchievement.id);
				this.events.broadcast(Events.NEW_ACHIEVEMENT, newAchievement);
				const achievement: Achievement = this.repository.getAllAchievements()
					.filter((ach) => ach.id == newAchievement.id)
					[0];
				// We store an history item every time, but we display only the first time an achievement is unlocked
				this.storeNewAchievementHistory(achievement, newAchievement.numberOfCompletions);
				this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, achievement, newAchievement.numberOfCompletions);
				// if (newAchievement.numberOfCompletions == 1) {
					this.sendNotification(achievement);
				// }
			}
		);
		this.events.on(Events.ACHIEVEMENT_RECORD_STARTED).subscribe((data) => this.handleAchievementRecordStarted(data));
		this.events.on(Events.ACHIEVEMENT_RECORDED).subscribe((data) => this.handleAchievementRecordCompleted(data));
		console.log('listening for achievement completion events');
	}

	public sendNotification(achievement: Achievement) {
		const text = this.nameService.displayName(achievement.id);
		console.log('sending new notification', text);
		this.notificationService.html({
			content: `
				<div class="achievement-message-container">
					<div class="achievement-image-container">
						<img src="http://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.cardId}.jpg" class="real-achievement"/>
						<i class="i-84x90 frame">
							<svg>
								<use xlink:href="/Files/assets/svg/sprite.svg#achievement_frame"/>
							</svg>
						</i>
					</div>
					<div class="message">
						<span class="title">Achievement unlocked!</span>
						<span class="text">${text}</span>
						<span class="recap-text">Click to expand</span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			type: 'achievement',
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
		const achievementId: string = data.data[0];
		const achievement: CompletedAchievement = await this.achievementStorage.loadAchievement(achievementId);
		const achievementReplayInfo = (achievement.replayInfo || []);
		console.log('processing tmp achievement', data, achievement, achievementReplayInfo);
		// This happens if app is killed before we can save
		if (achievementReplayInfo.length === 0 || achievementReplayInfo[0].url !== 'tmp') {
			const replayInfo: ReplayInfo = {
				url: 'tmp',
				creationTimestamp: undefined,
				path: undefined,
				thumbnailPath: undefined,
				thumbnailUrl: undefined
			};
			const newAchievement = new CompletedAchievement(
					achievement.id,
					achievement.numberOfCompletions,
					[replayInfo, ...achievementReplayInfo]);
			const result = await this.achievementStorage.saveAchievement(newAchievement);
			console.log('[recording] saved new tmp achievement recording', result);
		}
	}

	private async handleAchievementRecordCompleted(data) {
		const achievementId: string = data.data[0];
		const replayInfo: ReplayInfo = data.data[1];
		const achievement: CompletedAchievement = await this.achievementStorage.loadAchievement(achievementId);
		const realReplayInfo = [...achievement.replayInfo].slice(1, achievement.replayInfo.length - 1);
		console.log('after tmp removal', realReplayInfo, achievement.replayInfo);
		const newAchievement = new CompletedAchievement(
				achievement.id,
				achievement.numberOfCompletions,
				[replayInfo, ...realReplayInfo]);
		console.log('[recording] saving new achievement', newAchievement);
		const result = await this.achievementStorage.saveAchievement(newAchievement)
		console.log('[recording] saved new achievement', result);
		overwolf.windows.sendMessage(this.collectionWindowId, 'achievement-save-complete', newAchievement.id, () => {});
	}

	private handleEvent(gameEvent: GameEvent) {
		// console.log('[achievements] handling events', gameEvent);
		for (let challenge of this.repository.challengeModules) {
			challenge.detect(gameEvent, (data) => {
				// console.log('[achievements] challenge completed', gameEvent, data, challenge);
				this.achievementsReferee.complete(challenge, (newAchievement) => {
					this.newAchievements.next(newAchievement);
				}, data);
			});
		}
	}
}
