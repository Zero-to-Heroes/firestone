import { Injectable } from '@angular/core';
import { RewardTrackType } from '@firestone-hs/reference-data';
import { MemoryInspectionService, MemoryUpdatesService, RewardsTrackInfo } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { XpForGameInfo } from '@firestone/stats/common';
import { filter, take } from 'rxjs';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { Season } from '../stats/xp/xp-tables/_season';
import { Season6 } from '../stats/xp/xp-tables/season-6';
import { sleep } from '../utils';

@Injectable()
export class RewardMonitorService {
	private currentSeason: Season = new Season6();

	// This is a workaround until the XP memory updates are fixed
	private lastRewardTrackInfo: RewardsTrackInfo;
	private xpForGameInfo: XpForGameInfo;

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memory: MemoryInspectionService,
		private readonly gameStatus: GameStatusService,
		private readonly memoryUpdates: MemoryUpdatesService,
	) {
		this.init();
	}

	public async getXpForGameInfo(): Promise<XpForGameInfo> {
		return new Promise<XpForGameInfo>(async (resolve) => {
			let maxLoops = 30;
			while (this.xpForGameInfo == null && maxLoops >= 0) {
				await sleep(100);
				maxLoops--;
			}
			if (!this.xpForGameInfo) {
				console.warn('[rewards-monitor] could not get xpForGameInfo, getting rewardsTrackInfo');
				const rewardTrackInfos = await this.memory.getRewardsTrackInfo();
				if (rewardTrackInfos) {
					const rewardTrackInfo: RewardsTrackInfo = rewardTrackInfos.TrackEntries?.find(
						(track) => track.TrackType === RewardTrackType.GLOBAL,
					);
					if (this.lastRewardTrackInfo) {
						const levelsGained = rewardTrackInfo.Level - this.lastRewardTrackInfo.Level;
						const xpGained =
							levelsGained === 0
								? rewardTrackInfo.Xp - this.lastRewardTrackInfo.Xp
								: rewardTrackInfo.Xp +
								  // Xp needed to finish the previous level
								  (this.currentSeason.getXpForLevel(this.lastRewardTrackInfo.Level) -
										this.lastRewardTrackInfo.Xp) +
								  this.getXpForIntermediaryLevels(
										this.lastRewardTrackInfo.Level,
										rewardTrackInfo.Level,
								  );
						const xpModifier = 1 + (rewardTrackInfo?.XpBonusPercent ?? 0) / 100;
						const rawXpGained = xpGained / xpModifier;
						this.xpForGameInfo = {
							previousXp: this.lastRewardTrackInfo.Xp,
							previousLevel: this.lastRewardTrackInfo.Level,
							currentXp: rewardTrackInfo.Xp,
							currentLevel: rewardTrackInfo.Level,
							realXpGained: xpGained,
							xpGainedWithoutBonus: rawXpGained,
							levelsGained: levelsGained,
							bonusXp: rewardTrackInfo?.XpBonusPercent ? Math.round(xpGained - rawXpGained) : 0,
							xpNeeded: this.currentSeason.getXpForLevel(rewardTrackInfo.Level + 1),
						};
						console.log('[rewards-monitor] sent degraded info', this.xpForGameInfo);
						this.lastRewardTrackInfo = rewardTrackInfo;
						resolve(this.xpForGameInfo);
						return;
					} else {
						console.debug('[rewards-monitor] got rewardsTrackInfo', rewardTrackInfo);
						const partialInfo: XpForGameInfo = rewardTrackInfo
							? ({
									currentXp: rewardTrackInfo.Xp,
									currentLevel: rewardTrackInfo.Level,
									bonusXp: rewardTrackInfo.XpBonusPercent,
							  } as XpForGameInfo)
							: null;
						console.log('[rewards-monitor] sent partial info', partialInfo);
						this.lastRewardTrackInfo = rewardTrackInfo;
						resolve(partialInfo);
						return;
					}
				}
			}
			resolve(this.xpForGameInfo);
			return;
		});
	}

	private async init() {
		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => inGame),
				take(1),
			)
			.subscribe(async () => {
				console.log('[rewards-monitor] game started, init');
				this.gameEvents.onGameStart.subscribe(() => {
					this.xpForGameInfo = null;
				});
				this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
					if (changes?.XpChanges?.length) {
						console.debug('[rewards-monitor] received xp changes', changes.XpChanges);
						// If there are multiple causes for XP changes, like game end + quest, we
						// receive several items.
						// The first item seems to always be about the current match itself
						const xpChange = changes.XpChanges[0];
						// const prefs: Preferences = await this.prefs.getPreferences();
						const levelsGained = xpChange.CurrentLevel - xpChange.PreviousLevel;
						const xpGained =
							levelsGained === 0
								? xpChange.CurrentXp - xpChange.PreviousXp
								: xpChange.CurrentXp +
								  // Xp needed to finish the previous level
								  (this.currentSeason.getXpForLevel(xpChange.PreviousLevel) - xpChange.PreviousXp) +
								  this.getXpForIntermediaryLevels(xpChange.PreviousLevel, xpChange.CurrentLevel);
						const rewardTrackInfos = await this.memory.getRewardsTrackInfo();
						const rewardTrackInfo: RewardsTrackInfo = rewardTrackInfos?.TrackEntries?.find(
							(track) => track.TrackType === RewardTrackType.GLOBAL,
						);
						const xpModifier = 1 + (rewardTrackInfo?.XpBonusPercent ?? 0) / 100;
						const rawXpGained = xpGained / xpModifier;
						// if (prefs.showXpRecapAtGameEnd) {
						this.xpForGameInfo = {
							previousXp: xpChange.PreviousXp,
							previousLevel: xpChange.PreviousLevel,
							currentXp: xpChange.CurrentXp,
							currentLevel: xpChange.CurrentLevel,
							xpGainedWithoutBonus: rawXpGained,
							realXpGained: xpGained,
							levelsGained: levelsGained,
							bonusXp: rewardTrackInfo?.XpBonusPercent ? Math.round(xpGained - rawXpGained) : 0,
							xpNeeded: this.currentSeason.getXpForLevel(xpChange.CurrentLevel + 1),
						};
						console.log('[rewards-monitor] built xp for game', levelsGained, xpGained);
						// }
					}
				});
				const rewardTrackInfos = await this.memory.getRewardsTrackInfo();
				const rewardTrackInfo: RewardsTrackInfo = rewardTrackInfos?.TrackEntries?.find(
					(track) => track.TrackType === RewardTrackType.GLOBAL,
				);
				console.debug('[rewards-monitor] initialize values from rewardsTrackInfo', rewardTrackInfo);
				this.lastRewardTrackInfo = rewardTrackInfo;
			});
	}

	private getXpForIntermediaryLevels(startLevel: number, endLevel: number): number {
		// There is no missing intermediary level in this case
		if (endLevel - startLevel <= 1) {
			return 0;
		}
		let totalMissingXp = 0;
		for (let i = startLevel + 1; i <= endLevel - 1; i++) {
			const xpForFullLevel = this.currentSeason.getXpForLevel(i);
			totalMissingXp += xpForFullLevel;
		}
		return totalMissingXp;
	}
}
