import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { StatGameFormatType } from '../../models/mainwindow/stats/stat-game-format.type';
import { StatGameModeType } from '../../models/mainwindow/stats/stat-game-mode.type';
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
		const prefs = await this.prefs.getPreferences();
		if (!prefs.replaysShowNotification) {
			this.logger.debug(
				'[replays-notification] preference is turned off, not showing replay notification',
				stats,
			);
			return;
		}
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
		const playerRankImage = this.buildPlayerRankImage(stat.gameFormat, stat.gameMode, stat.playerRank);
		const rankText = this.buildRankText(stat) || '';
		return `
			<div class="match-stats-message-container ${stat.reviewId}">
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

	private buildPlayerRankImage(
		gameFormat: StatGameFormatType,
		gameMode: StatGameModeType,
		playerRank: string,
	): string {
		let rankIcon;
		if (gameMode === 'ranked') {
			const standard = 'standard_ranked';
			if (playerRank === 'legend') {
				rankIcon = `${standard}/legend`;
			} else if (!playerRank || parseInt(playerRank) >= 25) {
				rankIcon = `${standard}/rank25_small`;
			} else {
				rankIcon = `${standard}/rank${parseInt(playerRank)}_small`;
			}
		} else if (gameMode === 'battlegrounds') {
			rankIcon = 'battlegrounds';
		} else if (gameMode === 'practice') {
			rankIcon = 'casual';
		} else if (gameMode === 'casual') {
			rankIcon = 'casual';
		} else if (gameMode === 'friendly') {
			rankIcon = 'friendly';
		} else if (gameMode === 'arena') {
			rankIcon = 'arena/arena12wins';
		} else if (gameMode === 'tavern-brawl') {
			rankIcon = 'tavernbrawl';
		} else {
			rankIcon = 'arenadraft';
		}
		return `/Files/assets/images/deck/ranks/${rankIcon}.png`;
	}

	private buildRankText(info: GameStat): string {
		if (info.gameMode === 'ranked' || info.gameMode === 'battlegrounds') {
			return info.playerRank;
		}
		return null;
	}
}
