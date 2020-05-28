import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { BattleResultHistory, BgsGame } from '../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../models/battlegrounds/post-match/bgs-post-match-stats';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { BgsGameEndEvent } from './store/events/bgs-game-end-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

const BGS_RUN_STATS_ENDPOINT = 'https://6x37md7760.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class BgsRunStatsService {
	private stateUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly http: HttpClient,
		private readonly events: Events,
		private readonly ow: OverwolfService,
	) {
		this.events.on(Events.START_BGS_RUN_STATS).subscribe(async event => {
			this.computeRunStats(event.data[0], event.data[1]);
		});
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
	}

	private async computeRunStats(reviewId: string, currentGame: BgsGame) {
		const player: BgsPlayer = currentGame.getMainPlayer();
		const input: BgsComputeRunStatsInput = {
			reviewId: reviewId,
			battleResultHistory: currentGame.battleResultHistory,
			mainPlayer: player,
		};
		const postMatchStats: BgsPostMatchStats = (await this.http
			.post(BGS_RUN_STATS_ENDPOINT, input)
			.toPromise()) as BgsPostMatchStats;
		console.log('postMatchStats', postMatchStats);
		this.stateUpdater.next(new BgsGameEndEvent(postMatchStats));
	}
}

interface BgsComputeRunStatsInput {
	readonly reviewId: string;
	readonly battleResultHistory: readonly BattleResultHistory[];
	readonly mainPlayer: BgsPlayer;
}
