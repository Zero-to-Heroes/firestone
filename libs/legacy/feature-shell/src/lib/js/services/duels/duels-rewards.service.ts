import { Injectable } from '@angular/core';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryUpdate } from '@models/memory/memory-update';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { DuelsInfo } from '../../models/memory/memory-duels';
import { ApiRunner } from '../api-runner';
import { DuelsStateBuilderService } from '../duels/duels-state-builder.service';
import { Events } from '../events.service';
import { DungeonLootInfoUpdatedEvent } from '../mainwindow/store/events/duels/dungeon-loot-info-updated-event';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { ReviewIdService } from '../review-id.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { DuelsRunIdService } from './duels-run-id.service';

const DUNGEON_LOOT_INFO_URL = 'https://e4rso1a869.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class DuelsRewardsService {
	constructor(
		private memory: MemoryInspectionService,
		private ow: OverwolfService,
		private events: Events,
		private api: ApiRunner,
		private readonly duelsState: DuelsStateBuilderService,
		private readonly store: AppUiStoreFacadeService,
		private readonly reviewIdService: ReviewIdService,
		private readonly duelsRunIdService: DuelsRunIdService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.events
			.on(Events.MEMORY_UPDATE)
			.pipe(
				map((event) => event.data[0] as MemoryUpdate),
				filter((changes) => changes.IsDuelsRewardsPending),
				withLatestFrom(
					this.duelsRunIdService.duelsRunId$,
					this.duelsRunIdService.lastDuelsGame$,
					this.duelsState.duelsInfo$$,
					this.reviewIdService.reviewId$,
				),
			)
			.subscribe(([changes, duelsRunId, lastDuelsGame, duelsInfo, reviewId]) => {
				this.handleRewards(duelsRunId, lastDuelsGame, duelsInfo, reviewId);
			});
	}

	// If we launch the app on the rewards screen, we already dismiss the duels run as being over,
	// so we can't attach the rewards to the run. It's not big enough an issue to warrant changing
	// the current behavior
	public async handleRewards(duelsRunId: string, lastDuelsGame: GameStat, duelsInfo: DuelsInfo, reviewId: string) {
		console.log('[duels-rewards] trying to get rewards');
		// Force try it without reset to speed up the process
		let rewards = await this.memory.getDuelsRewardsInfo();
		console.log('[duels-rewards] reward', rewards);
		if (!rewards?.Rewards || rewards?.Rewards.length === 0) {
			console.log('[duels-rewards] no rewards, missed the timing? Retrying with force reset', rewards);
			rewards = await this.memory.getDuelsRewardsInfo(true);
			if (!rewards?.Rewards || rewards?.Rewards.length === 0) {
				console.log('[duels-rewards] no rewards, missed the timing?', rewards);
				return;
			}
		}

		const user = await this.ow.getCurrentUser();
		const rewardsInput = {
			type: lastDuelsGame.gameMode,
			reviewId: reviewId,
			runId: duelsRunId,
			userId: user.userId,
			userName: user.username,
			rewards: rewards,
			currentWins: duelsInfo.Wins,
			currentLosses: duelsInfo.Losses,
			rating: lastDuelsGame.gameMode === 'paid-duels' ? duelsInfo?.Rating : duelsInfo?.PaidRating,
			appVersion: process.env.APP_VERSION,
		} as Input;
		console.log('[duels-rewards] sending rewards info', rewardsInput);
		this.api.callPostApi(DUNGEON_LOOT_INFO_URL, rewardsInput);
		this.store.send(new DungeonLootInfoUpdatedEvent(rewardsInput));
	}
}
