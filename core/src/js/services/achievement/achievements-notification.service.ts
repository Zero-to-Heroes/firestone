import { Injectable } from '@angular/core';
import { Achievement } from 'src/js/models/achievement';
import { Events } from '../events.service';
import { Message, OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';
import { uuid } from '../utils';
import { AchievementsLoaderService } from './data/achievements-loader.service';

@Injectable()
export class AchievementsNotificationService {
	constructor(
		private notificationService: OwNotificationsService,
		private prefs: PreferencesService,
		private achievementLoader: AchievementsLoaderService,
		private events: Events,
	) {
		this.events.on(Events.ACHIEVEMENT_COMPLETE).subscribe((data) => this.handleAchievementCompleted(data.data[0]));
		console.log('[achievements-notification] listening for achievement completion events');
	}

	private async handleAchievementCompleted(achievement: Achievement) {
		console.log(
			'[achievements-notification] preparing achievement completed notification',
			achievement.id,
			achievement.numberOfCompletions,
		);
		const prefs = await this.prefs.getPreferences();
		if (achievement.numberOfCompletions > 1 || !prefs.achievementsDisplayNotifications2) {
			console.log(
				'[achievements-notification] achievement already completed or pref turned off, not sending any notif',
				achievement.id,
				prefs.achievementsDisplayNotifications2,
			);
			return;
		}
		// amplitude.getInstance().logEvent('new-achievement', { 'id': achievement.id });
		const recapText = (
			achievement.emptyText ??
			achievement.completedText ??
			`Achievement saved! Click to recap`
		).replace('to get started', '');
		console.log('[achievements-notification] sending new achievement completed notification', achievement.id);
		this.notificationService.addNotification({
			notificationId: achievement.id + uuid(),
			content: this.buildNotificationTemplate(achievement, recapText),
			type: 'achievement-no-record',
			app: 'achievement',
			cardId: achievement.id,
			theClass: 'no-record',
			clickToClose: true,
		} as Message);
	}

	private buildNotificationTemplate(achievement: Achievement, recapText: string): string {
		return `
			<div class="achievement-message-container ${achievement.id}">
				<div class="achievement-image-container">
					<img
						src="https://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.displayCardId}.jpg"
						class="real-achievement ${achievement.displayCardType}"/>
					<i class="i-84x90 frame">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#achievement_frame"/>
						</svg>
					</i>
				</div>
				<div class="message">
					<div class="title">
						<span>Achievement unlocked!</span>
					</div>
					<span class="text">${achievement.displayName}</span>
					<div class="recap-text">
						<span class="no-record">${recapText}</span>
					</div>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`;
	}
}
