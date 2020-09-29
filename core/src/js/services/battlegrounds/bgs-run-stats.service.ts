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
import { BgsPostMatchStatsForReview } from '../../models/battlegrounds/bgs-post-match-stats-for-review';
import { BgsPostMatchStats } from '../../models/battlegrounds/post-match/bgs-post-match-stats';
import { CurrentUser } from '../../models/overwolf/profile/current-user';
import { Events } from '../events.service';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent } from '../mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-with-remote-info-event';
import { BgsPostMatchStatsComputedEvent } from '../mainwindow/store/events/battlegrounds/bgs-post-match-stats-computed-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { UserService } from '../user.service';
import { BgsGameEndEvent } from './store/events/bgs-game-end-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

const BGS_UPLOAD_RUN_STATS_ENDPOINT = 'https://6x37md7760.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';
const BGS_RETRIEVE_RUN_STATS_ENDPOINT = ' https://pbd6q0rx4h.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class BgsRunStatsService {
	private bgsStateUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

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
		this.events.on(Events.POPULATE_HERO_DETAILS_FOR_BG).subscribe(async event => {
			this.computeHeroDetailsForBg(event.data[0]);
		});
		setTimeout(() => {
			this.bgsStateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	private async computeHeroDetailsForBg(heroCardId: string) {
		const lastHeroPostMatchStats = await this.retrieveLastBgsRunStats(heroCardId);
		console.log('lastHeroPostMatchStats', lastHeroPostMatchStats);
		this.stateUpdater.next(new BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent(lastHeroPostMatchStats));
	}

	private async retrieveLastBgsRunStats(
		heroCardId: string,
		numberOfStats?: number,
	): Promise<readonly BgsPostMatchStatsForReview[]> {
		const user = await this.userService.getCurrentUser();
		return new Promise<readonly BgsPostMatchStatsForReview[]>((resolve, reject) => {
			this.retrieveLastBgsRunStatsInternal(user, heroCardId, numberOfStats, result => resolve(result));
		});
	}

	private retrieveLastBgsRunStatsInternal(
		user: CurrentUser,
		heroCardId: string,
		numberOfStats: number,
		callback,
		retriesLeft = 1,
	) {
		if (retriesLeft <= 0) {
			console.error(
				'Could not load bgs post-match stats for',
				heroCardId,
				numberOfStats,
				`${BGS_RETRIEVE_RUN_STATS_ENDPOINT}`,
			);
			callback(null);
			return;
		}
		const input = {
			userId: user.userId,
			userName: user.username,
			heroCardId: heroCardId,
			limitResults: numberOfStats,
		};
		this.http.post(`${BGS_RETRIEVE_RUN_STATS_ENDPOINT}`, input).subscribe(
			(result: any) => {
				console.log('retrieved last hero stats for hero', result);
				callback(result);
			},
			error => {
				setTimeout(
					() =>
						this.retrieveLastBgsRunStatsInternal(
							user,
							heroCardId,
							numberOfStats,
							callback,
							retriesLeft - 1,
						),
					2000,
				);
			},
		);
	}

	private async computeRunStats(reviewId: string, currentGame: BgsGame, bestBgsUserStats: readonly BgsBestStat[]) {
		const prefs = await this.prefs.getPreferences();
		const user = await this.userService.getCurrentUser();
		const newMmr = await this.getNewRating(currentGame.mmrAtStart);

		const input: BgsComputeRunStatsInput = {
			reviewId: reviewId,
			heroCardId: currentGame.getMainPlayer()?.cardId,
			userId: user.userId,
			userName: user.username,
			battleResultHistory: currentGame.battleResultHistory.map(history => ({
				...history,
				simulationResult: { ...history.simulationResult, outcomeSamples: undefined },
			})),
			mainPlayer: currentGame.getMainPlayer(),
			oldMmr: currentGame.mmrAtStart,
			newMmr: newMmr,
		};
		// console.log('computing post-match stats input', input);

		const [postMatchStats, newBestValues] = this.populateObject(
			prefs.bgsUseLocalPostMatchStats
				? await this.buildStatsLocally(currentGame)
				: ((await this.http.post(BGS_UPLOAD_RUN_STATS_ENDPOINT, input).toPromise()) as IBgsPostMatchStats),
			input,
			bestBgsUserStats || [],
		);
		// console.log('newBestVaues', newBestValues, postMatchStats);

		// Even if stats are computed locally, we still do it on the server so that we can
		// archive the data. However, this is non-blocking
		if (prefs.bgsUseLocalPostMatchStats) {
			// console.log('posting to endpoint');
			this.http.post(BGS_UPLOAD_RUN_STATS_ENDPOINT, input).subscribe(
				result => console.log('request remote post-match stats success'),
				error => console.error('issue while posting post-match stats', error),
			);
		}
		// console.log('postMatchStats built', prefs.bgsUseLocalPostMatchStats, postMatchStats, currentGame);
		this.bgsStateUpdater.next(new BgsGameEndEvent(postMatchStats, newBestValues, reviewId));
		this.stateUpdater.next(new BgsPostMatchStatsComputedEvent(postMatchStats, newBestValues));
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
		//console.log('computing new best stats', data, input, existingBestStats);
		const newBestStats = buildNewStats(
			existingBestStats,
			data,
			({
				mainPlayer: input.mainPlayer,
				reviewId: input.reviewId,
				userId: input.userName || input.userId,
			} as any) as Input,
			`${new Date()
				.toISOString()
				.slice(0, 19)
				.replace('T', ' ')}.${new Date().getMilliseconds()}`,
		);
		const finalStats = this.mergeStats(existingBestStats, newBestStats);
		//console.log('built new best stats', newBestStats, finalStats);

		return [result, finalStats];
	}

	private mergeStats(existingBestStats: readonly BgsBestStat[], newBestStats: readonly BgsBestStat[]) {
		const statsToKeep = existingBestStats.filter(existing => !this.isStatIncluded(existing, newBestStats));
		//console.log('statsToKeep', newBestStats, statsToKeep);
		return [...newBestStats, ...statsToKeep];
	}

	private isStatIncluded(toFind: BgsBestStat, list: readonly BgsBestStat[]) {
		return list.find(existing => existing.statName === toFind.statName) != null;
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
		const battlegroundsInfo = await this.memoryService.getBattlegroundsEndGame();
		const newRating = battlegroundsInfo ? battlegroundsInfo.newRating : undefined;
		if (newRating === previousRating) {
			setTimeout(() => this.getNewRatingInternal(previousRating, callback, retriesLeft - 1), 500);
			return;
		}
		callback(newRating);
	}
}

interface BgsComputeRunStatsInput {
	readonly reviewId: string;
	readonly heroCardId: string;
	readonly userId: string;
	readonly userName: string;
	readonly battleResultHistory: readonly BattleResultHistory[];
	readonly mainPlayer: BgsPlayer;
	readonly oldMmr: number;
	readonly newMmr: number;
}
