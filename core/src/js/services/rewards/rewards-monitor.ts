import { Injectable } from '@angular/core';
import { Map } from 'immutable';
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
	private static readonly XP_PER_LEVEL: Map<number, number> = Map([
		[1, 0],
		[2, 100],
		[3, 150],
		[4, 200],
		[5, 300],
		[6, 450],
		[7, 600],
		[8, 750],
		[9, 900],
		[10, 1050],
		[11, 1250],
		[12, 1500],
		[13, 1750],
		[14, 2000],
		[15, 2200],
		[16, 2400],
		[17, 2500],
		[18, 2600],
		[19, 2700],
		[20, 2800],
		[21, 2900],
		[22, 3000],
		[23, 3100],
		[24, 3200],
		[25, 3300],
		[26, 3450],
		[27, 3600],
		[28, 3750],
		[29, 3900],
		[30, 4050],
		[31, 4250],
		[32, 4450],
		[33, 4650],
		[34, 4850],
		[35, 5050],
		[36, 5300],
		[37, 5550],
		[38, 5800],
		[39, 6050],
		[40, 6300],
		[41, 6600],
		[42, 6900],
		[43, 7200],
		[44, 7500],
		[45, 7800],
		[46, 8100],
		[47, 8400],
		[48, 8700],
		[49, 9000],
		[50, 9300],
		[51, 4000],
		[52, 4050],
		[53, 4100],
		[54, 4150],
		[55, 4200],
		[56, 4250],
		[57, 4300],
		[58, 4350],
		[59, 4400],
		[60, 4500],
	]);

	private infoAtGameStart: RewardsTrackInfo;
	private xpGainedForGame: number;
	private xpForGameInfo: XpForGameInfo;

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

	public async getXpForGameInfo(): Promise<XpForGameInfo> {
		return new Promise<XpForGameInfo>(async resolve => {
			let maxLoops = 30;
			while (this.xpForGameInfo == null && maxLoops >= 0) {
				await sleep(100);
				maxLoops--;
			}
			if (!this.xpForGameInfo) {
				console.log('[rewards-monitor] could not get xpForGameInfo', this.xpForGameInfo);
				resolve(null);
			}
			resolve(this.xpForGameInfo);
		});
	}

	private init() {
		this.gameEvents.allEvents.subscribe(async (event: GameEvent) => {
			if (event.type === GameEvent.MATCH_METADATA) {
				this.xpGainedForGame = undefined;
				this.xpForGameInfo = undefined;
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
							: infoAtGameEnd.Xp +
							  (this.infoAtGameStart.XpNeeded - this.infoAtGameStart.Xp) +
							  this.getXpForIntermediaryLevels(this.infoAtGameStart?.Level, infoAtGameEnd.Level);
					const xpModifier = 1 + (infoAtGameEnd.XpBonusPercent ?? 0) / 100;
					this.xpGainedForGame = xpGained / xpModifier;
					if (!this.areEqual(infoAtGameEnd, this.infoAtGameStart) && prefs.showXpRecapAtGameEnd) {
						this.xpForGameInfo = {
							xpGained: xpGained,
							bonusXp: infoAtGameEnd.XpBonusPercent ?? 0,
							levelsGained: levelsGained,
							currentXp: infoAtGameEnd.Xp,
							xpNeeded: infoAtGameEnd.XpNeeded,
						};
						console.log('[rewards-monitor] showing xp gained notification', levelsGained, xpGained);
						// this.showXpGainedNotification(levelsGained, xpGained, infoAtGameEnd);
					}
				} else {
					this.xpGainedForGame = -1;
				}
			}
		});
	}

	private getXpForIntermediaryLevels(startLevel: number, endLevel: number): number {
		// There is no missing intermediary level in this case
		if (endLevel - startLevel <= 1) {
			return 0;
		}
		let totalMissingXp = 0;
		for (let i = startLevel + 1; i <= endLevel - 1; i++) {
			const xpForFullLevel = RewardMonitorService.XP_PER_LEVEL.get(i, 4500);
			totalMissingXp += xpForFullLevel;
		}
		return totalMissingXp;
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

export interface XpForGameInfo {
	readonly xpGained: number;
	readonly bonusXp: number;
	readonly levelsGained: number;
	readonly currentXp: number;
	readonly xpNeeded: number;
}
