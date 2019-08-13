import { Injectable } from '@angular/core';
import { Achievement } from 'src/js/models/achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { GameEvents } from '../game-events.service';
import { AchievementCompletedEvent } from '../mainwindow/store/events/achievements/achievement-completed-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';
import { AchievementConfService } from './achievement-conf.service';
import { AchievementsRepository } from './achievements-repository.service';
import { AchievementsLoaderService } from './data/achievements-loader.service';

declare var ga;

@Injectable()
export class AchievementsMonitor {
	constructor(
		private gameEvents: GameEvents,
		private notificationService: OwNotificationsService,
		private prefs: PreferencesService,
		private conf: AchievementConfService,
		private repository: AchievementsRepository,
		private achievementLoader: AchievementsLoaderService,
		private store: MainWindowStoreService,
		private events: Events,
	) {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.handleEvent(gameEvent);
		});
		this.events.on(Events.ACHIEVEMENT_RECORDED).subscribe(data => this.handleAchievementRecordCompleted(data));
		this.events.on(Events.ACHIEVEMENT_COMPLETE).subscribe(data => this.handleAchievementCompleted(data));
		console.log('listening for achievement completion events');
	}

	private handleAchievementCompleted(data) {
		console.log('in pre-record notification', data);
		const achievement: Achievement = data.data[0];
		const numberOfCompletions = data.data[1];
		const challenge = data.data[2];
		ga('send', 'event', 'new-achievement', achievement.id);
		if (numberOfCompletions === 1) {
			this.sendPreRecordNotification(achievement, challenge.notificationTimeout());
		}
	}

	private async handleAchievementRecordCompleted(data) {
		const newAchievement: CompletedAchievement = data.data[0];
		if (newAchievement.numberOfCompletions === 1) {
			const achievement: Achievement = await this.achievementLoader.getAchievement(newAchievement.id);
			this.sendPostRecordNotification(achievement);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		// console.log('[achievements] handling events', gameEvent, this.achievementLoader.challengeModules);
		for (const challenge of this.achievementLoader.challengeModules) {
			challenge.detect(gameEvent, () => {
				this.store.stateUpdater.next(new AchievementCompletedEvent(challenge));
			});
		}
	}

	public async sendPreRecordNotification(achievement: Achievement, notificationTimeout: number) {
		console.log('sending new notification', achievement);
		let recapText = `Your replay is being recorded...<span class="loader"></span>`;
		const recordingOff = (await this.prefs.getPreferences()).dontRecordAchievements;
		if (recordingOff) {
			recapText = `Recording is disabled - <a class="open-settings">click here</a> to turn it on`;
		}
		const unclickable = recordingOff ? '' : 'unclickable';
		this.notificationService.html({
			// The achievement.id is used in the notification service to uniquely get the right notification
			// HTML element
			content: `
				<div class="achievement-message-container ${achievement.id} ${unclickable}">
					<div class="achievement-image-container">
						<img
							src="https://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.displayCardId}.jpg"
							class="real-achievement ${achievement.displayCardType}"/>
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
						<span class="text">${achievement.displayName}</span>
						<div class="recap-text">
							<span class="pending">${recapText}</span>
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
			theClass: recordingOff ? 'active' : undefined,
		});
	}

	public sendPostRecordNotification(achievement: Achievement) {
		// In case the pre-record notification has already timed out, we need to send a full notif
		this.notificationService.html({
			content: `
			<div class="achievement-message-container ${achievement.id}">
				<div class="achievement-image-container">
					<img
						src="https://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.displayCardId}.jpg"
						class="real-achievement ${achievement.displayCardType}"/>
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
					<span class="text">${achievement.displayName}</span>
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
			cardId: achievement.id,
		});
	}
}
