import { Injectable } from '@angular/core';
import { Map } from 'immutable';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
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
		[3, 100],
		[4, 150],
		[5, 150],
		[6, 225],
		[7, 225],
		[8, 300],
		[9, 300],
		[10, 325],
		[11, 325],
		[12, 350],
		[13, 350],
		[14, 375],
		[15, 375],
		[16, 400],
		[17, 400],
		[18, 425],
		[19, 425],
		[20, 450],
		[21, 450],
		[22, 550],
		[23, 600],
		[24, 650],
		[25, 675],
		[26, 675],
		[27, 875],
		[28, 875],
		[29, 1000],
		[30, 1100],
		[31, 1200],
		[32, 1200],
		[33, 1250],
		[34, 1250],
		[35, 1300],
		[36, 1300],
		[37, 1350],
		[38, 1350],
		[39, 1400],
		[40, 1400],
		[41, 1450],
		[42, 1450],
		[43, 1500],
		[44, 1500],
		[45, 1550],
		[46, 1550],
		[47, 1600],
		[48, 1600],
		[49, 1650],
		[50, 1650],
		[51, 1700],
		[52, 1700],
		[53, 1750],
		[54, 1750],
		[55, 1800],
		[56, 1800],
		[57, 1850],
		[58, 1850],
		[59, 1900],
		[60, 1900],
		[61, 1950],
		[62, 1950],
		[63, 2000],
		[64, 2000],
		[65, 2050],
		[66, 2050],
		[67, 2125],
		[68, 2125],
		[69, 2250],
		[70, 2250],
		[71, 2375],
		[72, 2375],
		[73, 2500],
		[74, 2500],
		[75, 2500],
		[76, 2500],
		[77, 2500],
		[78, 2500],
		[79, 2500],
		[80, 2500],
		[81, 2500],
		[82, 2500],
		[83, 2500],
		[84, 2500],
		[85, 2500],
		[86, 2500],
		[87, 2500],
		[88, 2500],
		[89, 2500],
		[90, 2500],
		[91, 2500],
		[92, 2500],
		[93, 2500],
		[94, 2500],
		[95, 2500],
		[96, 2500],
		[97, 2500],
		[98, 2500],
		[99, 2500],
		[100, 2500],
		[101, 1325],
		[102, 1325],
		[103, 1350],
		[104, 1350],
		[105, 1350],
		[106, 1350],
		[107, 1350],
		[108, 1350],
		[109, 1375],
		[110, 1375],
		[111, 1375],
		[112, 1375],
		[113, 1400],
		[114, 1400],
		[115, 1400],
		[116, 1400],
		[117, 1400],
		[118, 1400],
		[119, 1425],
		[120, 1425],
		[121, 1425],
		[122, 1450],
		[123, 1450],
		[124, 1450],
		[125, 1450],
		[126, 1450],
		[127, 1450],
		[128, 1475],
		[129, 1475],
		[130, 1475],
	]);

	// private infoAtGameStart: RewardsTrackInfo;
	private xpGainedForGame: number;
	private xpForGameInfo: XpForGameInfo;

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly events: Events,
		private readonly memory: MemoryInspectionService,
		private readonly prefs: PreferencesService,
		private readonly notificationService: OwNotificationsService,
	) {
		this.init();
	}

	public async getXpGained(): Promise<number> {
		const xpForGame = await this.getXpForGameInfo();
		return xpForGame?.xpGainedWithoutBonus;
	}

	public async getXpForGameInfo(): Promise<XpForGameInfo> {
		return new Promise<XpForGameInfo>(async (resolve) => {
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
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			const changes: MemoryUpdate = data.data[0];
			if (changes?.XpChanges?.length) {
				console.log('[rewards-monitor] received xp changes', changes.XpChanges);
				// Not sure what the other items are about
				const xpChange = changes.XpChanges[0];
				// const prefs: Preferences = await this.prefs.getPreferences();
				const levelsGained = xpChange.CurrentLevel - xpChange.PreviousLevel;
				const xpGained =
					levelsGained === 0
						? xpChange.CurrentXp - xpChange.PreviousXp
						: xpChange.CurrentXp +
						  // Xp needed to finish the previous level
						  (RewardMonitorService.XP_PER_LEVEL.get(xpChange.PreviousLevel, 1500) - xpChange.PreviousXp) +
						  this.getXpForIntermediaryLevels(xpChange.PreviousLevel, xpChange.CurrentLevel);
				const rewardTrackInfo = await this.memory.getRewardsTrackInfo();
				const xpModifier = 1 + (rewardTrackInfo?.XpBonusPercent ?? 0) / 100;
				const rawXpGained = xpGained / xpModifier;
				// if (prefs.showXpRecapAtGameEnd) {
				this.xpForGameInfo = {
					xpGainedWithoutBonus: rawXpGained,
					realXpGained: xpGained,
					bonusXp: rewardTrackInfo?.XpBonusPercent ? Math.round(xpGained - rawXpGained) : 0,
					levelsGained: levelsGained,
					currentXp: xpChange.CurrentXp,
					xpNeeded: RewardMonitorService.XP_PER_LEVEL.get(xpChange.CurrentLevel, 1500),
				};
				console.log('[rewards-monitor] showing xp gained notification', levelsGained, xpGained);
				// }
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
			const xpForFullLevel = RewardMonitorService.XP_PER_LEVEL.get(i, 1500);
			totalMissingXp += xpForFullLevel;
		}
		return totalMissingXp;
	}
}

export interface XpForGameInfo {
	readonly xpGainedWithoutBonus: number;
	readonly realXpGained: number;
	readonly bonusXp: number;
	readonly levelsGained: number;
	readonly currentXp: number;
	readonly xpNeeded: number;
}
