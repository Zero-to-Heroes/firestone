import { Injectable } from '@angular/core';
import { GameEvent } from '../../models/game-event';
import { Preferences } from '../../models/preferences';
import { RewardsTrackInfo } from '../../models/rewards-track-info';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { OwNotificationsService } from '../notifications.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { sleep } from '../utils';

@Injectable()
export class RewardMonitorService {
	private infoAtGameStart: RewardsTrackInfo;

	private xpGainedForGame: number;

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memory: MemoryInspectionService,
		private readonly prefs: PreferencesService,
		private readonly notificationService: OwNotificationsService,
	) {
		if (!FeatureFlags.ENABLE_XP_NOTIFICATION) {
			return;
		}
		this.init();
		window['hop'] = async (levels: number, xp: number) => {
			this.showXpGainedNotification(levels, xp, {
				Level: 16,
				Xp: 20,
				XpBonusPercent: 10,
				XpNeeded: 2000,
			});
		};
	}

	public async getXpGained(): Promise<number> {
		return new Promise<number>(async resolve => {
			let maxLoops = 30;
			while (this.xpGainedForGame == null && maxLoops >= 0) {
				await sleep(100);
				maxLoops--;
			}
			if (this.xpGainedForGame == null || this.xpGainedForGame === -1) {
				console.log('[rewards-monitor] could not get rewards info', this.xpGainedForGame);
				resolve(null);
			}
			resolve(this.xpGainedForGame);
		});
	}

	private init() {
		this.gameEvents.allEvents.subscribe(async (event: GameEvent) => {
			if (event.type === GameEvent.MATCH_METADATA) {
				this.xpGainedForGame = undefined;
				this.infoAtGameStart = await this.memory.getRewardsTrackInfo();
				console.log('[rewards-monitor] rewards info at game start', this.infoAtGameStart);
			} else if (event.type === GameEvent.GAME_END) {
				const infoAtGameEnd = await this.getUpdatedRewardsInfo();
				console.log('[rewards-monitor] rewards info at game end', infoAtGameEnd);
				const prefs: Preferences = await this.prefs.getPreferences();
				if (infoAtGameEnd) {
					const levelsGained = infoAtGameEnd.Level - this.infoAtGameStart?.Level ?? 0;
					const xpGained =
						levelsGained === 0
							? infoAtGameEnd.Xp - this.infoAtGameStart?.Xp ?? 0
							: infoAtGameEnd.Xp + this.infoAtGameStart.XpNeeded - this.infoAtGameStart.Xp;
					const xpModifier = 1 + (infoAtGameEnd.XpBonusPercent ?? 0) / 100;
					this.xpGainedForGame = xpGained / xpModifier;
					if (!this.areEqual(infoAtGameEnd, this.infoAtGameStart) && prefs.showXpRecapAtGameEnd) {
						console.log('[rewards-monitor] showing xp gained notification', levelsGained, xpGained);
						this.showXpGainedNotification(levelsGained, xpGained, infoAtGameEnd);
					}
				} else {
					this.xpGainedForGame = -1;
				}
			}
		});
	}

	private async getUpdatedRewardsInfo() {
		let info = await this.memory.getRewardsTrackInfo();
		let retriesLeft = 5;
		while (retriesLeft >= 0 && this.infoAtGameStart && (!info || this.areEqual(this.infoAtGameStart, info))) {
			console.log('[rewards-monitor] info not updated', info, this.infoAtGameStart, retriesLeft);
			await sleep(1000);
			info = await this.memory.getRewardsTrackInfo();
			retriesLeft--;
		}
		// if (this.areEqual(this.infoAtGameStart, info)) {
		// 	return null;
		// }
		return info;
	}

	private areEqual(a: RewardsTrackInfo, b: RewardsTrackInfo): boolean {
		return (
			a.Level === b.Level && a.Xp === b.Xp && a.XpNeeded === b.XpNeeded && a.XpBonusPercent === b.XpBonusPercent
		);
	}

	private showXpGainedNotification(levelsGained: number, xpGained: number, infoAtGameEnd: RewardsTrackInfo) {
		const levelsGainedEl = levelsGained
			? `
				<div class="xp-level">
					<span class="text">Levels gained:</span>
					<span class="value">${levelsGained}</span>
				</div>`
			: '';
		const xpBonusEl = infoAtGameEnd.XpBonusPercent
			? `
				<div class="xp-bonus">
					<span class="text">Xp bonus:</span>
					<span class="value">${infoAtGameEnd.XpBonusPercent}%</span>
				</div>`
			: '';
		this.notificationService.emitNewNotification({
			content: `
				<div class="rewards-message-container">
					<div class="title">Match over!</div>
					${levelsGainedEl}
					<div class="xp-text">
						<span class="text">Xp gained:</span>
						<span class="value">${xpGained}</span>
						<div class="progress">
							<span class="item bracket">[</span>
							<span class="item">${infoAtGameEnd.Xp}</span>
							<span class="item separator">/</span>
							<span class="item">${infoAtGameEnd.XpNeeded}</span>
							<span class="item bracket">]</span>
						</div>
					</div>
					${xpBonusEl}
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			notificationId: `rewards-${Date.now()}`,
			timeout: 0,
			type: 'rewards',
		});
	}
}
