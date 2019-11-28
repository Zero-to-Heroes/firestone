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
		this.events.on(Events.GAME_STATS_UPDATED).subscribe(data => this.showNewMatchEndNotification(data.data[0]));
		this.logger.debug('[replays-notification] listening for achievement completion events');
	}

	private async showNewMatchEndNotification(stats: GameStats) {
		this.logger.debug('[replays-notification] preparing new game stat notification', stats);
		const stat = stats.stats[0];
		this.notificationService.emitNewNotification({
			notificationId: stat.reviewId,
			content: this.buildNotificationTemplate(stat),
			type: 'match-stats-recorded',
			app: 'replays',
			cardId: undefined,
			theClass: 'active',
			clickToClose: true,
			eventToSendOnClick: () => new ShowReplayEvent(stat.reviewId),
		} as Message);
	}

	private buildNotificationTemplate(stat: GameStat): string {
		return `
			<div class="match-stats-message-container ${stat.reviewId}">
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
