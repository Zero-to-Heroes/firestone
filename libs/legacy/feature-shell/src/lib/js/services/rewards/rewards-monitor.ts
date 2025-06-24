import { Injectable } from '@angular/core';
import { RewardTrackType } from '@firestone-hs/reference-data';
import { MemoryUpdatesService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { XpForGameInfo } from '@firestone/stats/common';
import { BehaviorSubject, filter, take } from 'rxjs';
import { GameEventsEmitterService } from '../game-events-emitter.service';

@Injectable()
export class RewardMonitorService {
	private xpForGameInfo$$ = new BehaviorSubject<XpForGameInfo>(null);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly gameStatus: GameStatusService,
		private readonly memoryUpdates: MemoryUpdatesService,
	) {
		this.init();
	}

	public async getXpForGameInfo(): Promise<XpForGameInfo> {
		let retriesLeft = 50;
		while (!this.xpForGameInfo$$.value && retriesLeft > 0) {
			await sleep(100);
			retriesLeft--;
		}
		return this.xpForGameInfo$$?.value;
	}

	private async init() {
		await waitForReady(this.gameStatus);

		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => inGame),
				take(1),
			)
			.subscribe(async () => {
				this.gameEvents.onGameStart.subscribe(() => {
					this.xpForGameInfo$$.next(null);
				});

				this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
					if (changes?.XpChanges?.length) {
						console.debug('[rewards-monitor] received xp changes', changes.XpChanges);
						const xpChange = changes.XpChanges.find(
							(change) => change.RewardTrackType === RewardTrackType.GLOBAL,
						);

						if (!!xpChange) {
							const xpGained = xpChange.XpGained;
							const xpModifier = 1 + (xpChange.XpBonusPercent ?? 0) / 100;
							const rawXpGained = xpGained / xpModifier;
							const xpForGameInfo: XpForGameInfo = {
								currentXp: xpChange.CurrentXpInLevel,
								currentLevel: xpChange.CurrentLevel,
								xpGainedWithoutBonus: rawXpGained,
								realXpGained: xpGained,
								bonusXp: xpChange.XpBonusPercent ? Math.round(xpGained - rawXpGained) : 0,
								xpNeeded: xpChange.CurrentXpNeededForLevel,
							};
							console.log('[rewards-monitor] built xp for game', xpGained);
							this.xpForGameInfo$$.next(xpForGameInfo);
						}
					}
				});
			});
	}
}
