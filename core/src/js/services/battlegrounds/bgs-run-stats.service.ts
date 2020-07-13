import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/compute-bgs-run-stats/dist/model/bgs-best-stat';
import { Input } from '@firestone-hs/compute-bgs-run-stats/dist/model/input';
import { buildNewStats } from '@firestone-hs/compute-bgs-run-stats/dist/stats-builder';
import {
	BattleResultHistory,
	BgsPostMatchStats as IBgsPostMatchStats,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import Worker from 'worker-loader!../../workers/bgs-post-match-stats.worker';
import { BgsGame } from '../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../models/battlegrounds/post-match/bgs-post-match-stats';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { UserService } from '../user.service';
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
		private readonly prefs: PreferencesService,
		private readonly userService: UserService,
		private readonly memoryService: MemoryInspectionService,
	) {
		this.events.on(Events.START_BGS_RUN_STATS).subscribe(async event => {
			this.computeRunStats(event.data[0], event.data[1], event.data[2]);
		});
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
	}

	private async computeRunStats(reviewId: string, currentGame: BgsGame, bestBgsUserStats: readonly BgsBestStat[]) {
		const prefs = await this.prefs.getPreferences();
		const user = await this.userService.getCurrentUser();
		const newMmr = await this.getNewRating(currentGame.mmrAtStart);
		const input: BgsComputeRunStatsInput = {
			reviewId: reviewId,
			userId: user.username || user.userId,
			battleResultHistory: currentGame.battleResultHistory,
			mainPlayer: currentGame.getMainPlayer(),
			oldMmr: currentGame.mmrAtStart,
			newMmr: newMmr,
		};

		// console.error('dev stuff to be removed here', bestBgsUserStats);
		// bestBgsUserStats = bestBgsUserStats.map(stat =>
		// 	stat.statName === 'maxBoardStats' ? { ...stat, value: 0 } : stat,
		// );
		let [postMatchStats, newBestValues] = this.populateObject(
			prefs.bgsUseLocalPostMatchStats
				? await this.buildStatsLocally(currentGame)
				: ((await this.http.post(BGS_RUN_STATS_ENDPOINT, input).toPromise()) as IBgsPostMatchStats),
			input,
			bestBgsUserStats || [],
		);
		console.log('newBestVaues', newBestValues);
		// Even if stats are computed locally, we still do it on the server so that we can
		// archive the data. However, this is non-blocking
		if (prefs.bgsUseLocalPostMatchStats) {
			// console.log('posting to endpoint');
			this.http.post(BGS_RUN_STATS_ENDPOINT, input).subscribe(
				result => console.log('request remote post-match stats success'),
				error => console.error('issue while posting post-match stats', error),
			);
		}
		console.log('postMatchStats built', prefs.bgsUseLocalPostMatchStats);
		this.stateUpdater.next(new BgsGameEndEvent(postMatchStats, newBestValues));
	}

	private async buildStatsLocally(currentGame: BgsGame): Promise<IBgsPostMatchStats> {
		return new Promise<IBgsPostMatchStats>(resolve => {
			const worker = new Worker();
			worker.onmessage = (ev: MessageEvent) => {
				// console.log('received worker message', ev);
				worker.terminate();
				const resultData: IBgsPostMatchStats = JSON.parse(ev.data);
				resolve(resultData);
			};

			const input = {
				replayXml: currentGame.replayXml,
				mainPlayer: currentGame.getMainPlayer(),
				battleResultHistory: currentGame.battleResultHistory,
			};
			console.log('created worker');
			worker.postMessage(input);
			console.log('posted worker message');
		});
	}

	private populateObject(
		data: IBgsPostMatchStats,
		input: BgsComputeRunStatsInput,
		existingBestStats: readonly BgsBestStat[],
	): [BgsPostMatchStats, readonly BgsBestStat[]] {
		const result: BgsPostMatchStats = BgsPostMatchStats.create({
			...data,
			// We do this because the immutable maps are all messed up when going back and forth
			boardHistory: input.mainPlayer.boardHistory,
		});
		const newBestStats = buildNewStats(
			existingBestStats,
			data,
			({
				mainPlayer: input.mainPlayer,
				reviewId: input.reviewId,
				userId: input.userId,
			} as any) as Input,
			`${new Date()
				.toISOString()
				.slice(0, 19)
				.replace('T', ' ')}.${new Date().getMilliseconds()}`,
		);
		return [result, newBestStats];
	}

	private async getNewRating(previousRating: number): Promise<number> {
		return new Promise<number>(resolve => {
			this.getNewRatingInternal(previousRating, newRating => resolve(newRating));
		});
	}

	private async getNewRatingInternal(previousRating: number, callback, retriesLeft = 10) {
		if (retriesLeft <= 0) {
			// This actually happens quite a lot, as you can't get the new rating before
			// moving on to the next screen?
			// Check BaconEndGameScreen
			console.warn('Could not get new rating', previousRating);
			callback(previousRating);
			return;
		}
		const newRating = (await this.memoryService.getBattlegroundsInfo())?.rating;
		if (newRating === previousRating) {
			setTimeout(() => this.getNewRatingInternal(previousRating, callback, retriesLeft - 1), 500);
			return;
		}
		callback(newRating);
	}
}

interface BgsComputeRunStatsInput {
	readonly reviewId: string;
	readonly userId: string;
	readonly battleResultHistory: readonly BattleResultHistory[];
	readonly mainPlayer: BgsPlayer;
	readonly oldMmr: number;
	readonly newMmr: number;
}
