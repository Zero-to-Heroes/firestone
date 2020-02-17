import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { Events } from '../events.service';
import { ShowReplayEvent } from '../mainwindow/store/events/replays/show-replay-event';
import { Message, OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';

declare var amplitude;

@Injectable()
export class ReplaysNotificationService {
	constructor(
		private logger: NGXLogger,
		private notificationService: OwNotificationsService,
		private prefs: PreferencesService,
		private events: Events,
	) {
		this.events
			.on(Events.GAME_STATS_UPDATED)
			.subscribe(data => this.showNewMatchEndNotification(Object.assign(new GameStats(), data.data[0])));
		this.events.on(Events.GAME_END).subscribe(data => this.showReplayRecordingStart(data.data[0]));

		this.logger.debug('[replays-notification] listening for achievement completion events');
	}

	private async showReplayRecordingStart(reviewId: string) {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.replaysShowNotification) {
			this.logger.debug(
				'[replays-notification] preference is turned off, not showing replay start notification',
				reviewId,
			);
			return;
		}
		this.logger.debug('[replays-notification] preparing replay start notification', reviewId);
		// this.logger.debug('[replays-notification] will emit notif notification', stat);
		this.notificationService.emitNewNotification({
			notificationId: `replay-${reviewId}`,
			content: this.buildStartNotificationTemplate(reviewId),
			type: 'match-stats-recorded',
			app: 'replays',
			cardId: undefined,
			theClass: 'remove-on-update',
			clickToClose: true,
		} as Message);
	}

	private async showNewMatchEndNotification(stats: GameStats) {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.replaysShowNotification) {
			this.logger.debug(
				'[replays-notification] preference is turned off, not showing replay notification',
				stats,
			);
			return;
		}
		const stat = Object.assign(new GameStat(), stats.stats[0]);
		this.logger.debug('[replays-notification] preparing new game stat notification', stat);
		// this.logger.debug('[replays-notification] will emit notif notification', stat);
		this.notificationService.emitNewNotification({
			notificationId: `replay-${stat.reviewId}`,
			content: this.buildNotificationTemplate(stat),
			type: 'match-stats-recorded',
			app: 'replays',
			cardId: undefined,
			theClass: 'active',
			clickToClose: true,
			eventToSendOnClick: () => new ShowReplayEvent(stat.reviewId),
		} as Message);
	}

	private buildStartNotificationTemplate(reviewId: string): string {
		return `
			<div class="match-stats-message-container replay-${reviewId} unclickable">
				<div class="loading-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#loading_spiral" />
					</svg>
				</div>
				<div class="message">
					<div class="title">
						<span>Game replay being recorded</span>
					</div>
					<span class="text">Hold tight!</span>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`;
	}

	private buildNotificationTemplate(stat: GameStat): string {
		const [playerRankImage, playerRankTooltip] = stat.buildPlayerRankImage();
		// this.logger.debug('[replays-notification] preparing playerRankImage', playerRankImage);
		const rankText = stat.buildRankText() || '';
		// this.logger.debug('[replays-notification] preparing rankText', rankText);
		return `
			<div class="match-stats-message-container replay-${stat.reviewId}">
				<div class="mode">
					<img class="player-rank" src="${playerRankImage}" />
					<div class="rank-text">${rankText}</div>
				</div>
				<div class="message">
					<div class="title">
						<span>Game replay saved</span>
					</div>
					<span class="text">Click here to watch it</span>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`;
	}
}
