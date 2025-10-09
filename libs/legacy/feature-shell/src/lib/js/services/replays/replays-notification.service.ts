import { Injectable } from '@angular/core';
import {
	GameStatusService,
	Message,
	OwNotificationsService,
	PreferencesService,
} from '@firestone/shared/common/service';
import { XpForGameInfo } from '@firestone/stats/common';
import { GameStat, buildRankText } from '@firestone/stats/data-access';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { distinctUntilChanged, filter, map, skip, take } from 'rxjs';

import { BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import { isBattlegrounds } from '@firestone/game-state';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { ShowReplayEvent } from '../mainwindow/store/events/replays/show-replay-event';
import { RewardMonitorService } from '../rewards/rewards-monitor';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

@Injectable()
export class ReplaysNotificationService {
	constructor(
		private readonly notificationService: OwNotificationsService,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
		private readonly store: AppUiStoreFacadeService,
		private readonly gameStats: GameStatsLoaderService,
		private readonly gameStatus: GameStatusService,
		private readonly rewardsMonitor: RewardMonitorService,
		private readonly bgsNav: BgsInGameWindowNavigationService,
	) {
		this.init();
	}

	private async init() {
		await this.gameStats.isReady();

		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => inGame),
				take(1),
			)
			.subscribe(() => {
				this.gameStats.gameStats$$
					.pipe(
						filter((stats) => !!stats?.stats?.length),
						map((stats) => stats.stats[0]),
						distinctUntilChanged((a, b) => a?.reviewId === b?.reviewId),
						skip(1),
					)
					.subscribe((gameStat) => this.showNewMatchEndNotification(gameStat));
			});
	}

	private async showNewMatchEndNotification(gameStat: GameStat) {
		console.debug('[replays-notification] received new game, preparing notification?');
		const prefs = await this.prefs.getPreferences();
		if (isBattlegrounds(gameStat.gameMode) && prefs.bgsShowEndGameNotif) {
			this.showBgsMatchEndNotification(gameStat);
		}

		if (!prefs.showXpRecapAtGameEnd) {
			console.debug('[replays-notification] preference is turned off, not showing replay notification');
			return;
		}

		const xpForGame = await this.rewardsMonitor.getXpForGameInfo();
		if (!xpForGame?.realXpGained) {
			return;
		}

		console.debug('[replays-notification] preparing new game stat notification', gameStat);

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
		this.notificationService.emitNewNotification({
			notificationId: `replay-bg-${gameStat.reviewId}`,
			content: this.buildBgsNotificationTemplate(gameStat),
			type: 'match-stats-recorded',
			app: 'replays',
			cardId: undefined,
			theClass: 'active',
			clickToClose: true,
			timeout: 8000,
			eventToSendOnClick: () => {
				console.debug('[replays-notification] clicking on bgs match end');
				this.bgsNav.forcedStatus$$.next('open');
			},
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
