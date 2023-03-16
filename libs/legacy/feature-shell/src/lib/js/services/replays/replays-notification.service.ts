import { Injectable } from '@angular/core';
import { buildRankText, GameStat } from '@firestone/stats/data-access';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { BattlegroundsStoreService } from '../battlegrounds/store/battlegrounds-store.service';
import { BgsShowPostMatchStatsEvent } from '../battlegrounds/store/events/bgs-show-post-match-stats-event';
import { Events } from '../events.service';
import { ShowReplayEvent } from '../mainwindow/store/events/replays/show-replay-event';
import { Message, OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';
import { RewardMonitorService, XpForGameInfo } from '../rewards/rewards-monitor';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

@Injectable()
export class ReplaysNotificationService {
	constructor(
		private readonly notificationService: OwNotificationsService,
		private readonly prefs: PreferencesService,
		private readonly events: Events,
		private readonly rewards: RewardMonitorService,
		private readonly i18n: LocalizationFacadeService,
		private readonly store: AppUiStoreFacadeService,
		private readonly bgsStore: BattlegroundsStoreService,
	) {
		this.events.on(Events.GAME_STATS_UPDATED).subscribe((data) => this.showNewMatchEndNotification(data.data[0]));
		console.log('[replays-notification] listening for achievement completion events');
	}

	private async showNewMatchEndNotification(gameStats: GameStats) {
		const gameStat = gameStats.stats[0];
		const prefs = await this.prefs.getPreferences();
		if (isBattlegrounds(gameStat.gameMode) && prefs.bgsShowEndGameNotif) {
			await this.showBgsMatchEndNotification(gameStat);
		}

		if (!prefs.showXpRecapAtGameEnd) {
			console.log('[replays-notification] preference is turned off, not showing replay notification');
			return;
		}

		const xpForGame = await this.rewards.getXpForGameInfo();
		if (!xpForGame?.realXpGained) {
			return;
		}

		console.log('[replays-notification] preparing new game stat notification', gameStat);

		this.notificationService.emitNewNotification({
			notificationId: `replay-${gameStat.reviewId}`,
			content: this.buildNotificationTemplate(gameStat, xpForGame),
			type: 'match-stats-recorded',
			app: 'replays',
			cardId: undefined,
			theClass: 'active',
			clickToClose: true,
			eventToSendOnClick: () => this.store.send(new ShowReplayEvent(gameStat.reviewId)),
		} as Message);
	}

	private async showBgsMatchEndNotification(gameStat: GameStat) {
		return;
		this.notificationService.emitNewNotification({
			notificationId: `replay-bg-${gameStat.reviewId}`,
			content: this.buildBgsNotificationTemplate(gameStat),
			type: 'match-stats-recorded',
			app: 'replays',
			cardId: undefined,
			theClass: 'active',
			clickToClose: true,
			eventToSendOnClick: () => this.bgsStore.battlegroundsUpdater.next(new BgsShowPostMatchStatsEvent()),
		} as Message);
	}

	private buildBgsNotificationTemplate(stat: GameStat): string {
		const rankImage = stat.buildPlayerRankImage(this.i18n);
		const rankText = buildRankText(stat.playerRank, stat.gameMode, stat.additionalResult) ?? '';
		const playerRankImage = rankImage.medalImage ? `<img class="art" src="${rankImage.medalImage}" />` : ``;
		return `
			<div class="general-message-container">
				<div class="mode rank-image has-tooltip">
					<div class="rank-icon">
						${playerRankImage}
						<img class="frame" src="${rankImage.frameImage}" />
					</div>
					<div class="rank-text">${rankText}</div>
					<span class="tooltip">Click to watch the replay</span>
				</div>
				<div class="message">
					<div class="title">
						<span>Click to view your game's stats</span>
					</div>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`;
	}

	private buildNotificationTemplate(stat: GameStat, xpForGame: XpForGameInfo): string {
		const rankImage = stat.buildPlayerRankImage(this.i18n);
		const rankText = buildRankText(stat.playerRank, stat.gameMode, stat.additionalResult) ?? '';
		const playerRankImage = rankImage.medalImage ? `<img class="art" src="${rankImage.medalImage}" />` : ``;
		const bonusClass = xpForGame?.bonusXp ? 'bonus' : '';
		// TODO translate
		const xpEl = xpForGame
			? `
			<div class="xp-text">
				<span class="text">You gained</span>
				<div class="value ${bonusClass} has-tooltip">
					<span class="xp-value">${xpForGame.realXpGained}</span>
					<span class="tooltip xp-bonus ${bonusClass}">${xpForGame.bonusXp ? xpForGame.bonusXp : 'No'} XP bonus</span>
				</div>
				<span class="text">XP this match</span>
				<div class="progress">
					<span class="item bracket">(</span>
					<span class="item">${xpForGame.currentXp}</span>
					<span class="item separator">/</span>
					<span class="item">${xpForGame.xpNeeded}</span>
					<span class="item bracket">)</span>
				</div>
			</div>`
			: '';
		return `
			<div class="match-stats-message-container replay-${stat.reviewId}">
				<div class="mode rank-image has-tooltip">
					<div class="rank-icon">
						${playerRankImage}
						<img class="frame" src="${rankImage.frameImage}" />
					</div>
					<div class="rank-text">${rankText}</div>
					<span class="tooltip">Click to watch the replay</span>
				</div>
				<div class="message">
					<div class="title">
						<span>Your match has been recorded</span>
					</div>
					<div class="xp">
						${xpEl}
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
