import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import Worker from 'worker-loader!../../workers/bgs-post-match-stats.worker';
import { BgsGame } from '../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../models/battlegrounds/post-match/bgs-post-match-stats';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
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
	) {
		this.events.on(Events.START_BGS_RUN_STATS).subscribe(async event => {
			this.computeRunStats(event.data[0], event.data[1]);
		});
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
	}

	private async computeRunStats(reviewId: string, currentGame: BgsGame) {
		const prefs = await this.prefs.getPreferences();
		const input: BgsComputeRunStatsInput = {
			reviewId: reviewId,
			battleResultHistory: currentGame.battleResultHistory,
			mainPlayer: currentGame.getMainPlayer(),
		};

		const postMatchStats: BgsPostMatchStats = prefs.bgsUseLocalPostMatchStats
			? await this.buildStatsLocally(currentGame)
			: ((await this.http.post(BGS_RUN_STATS_ENDPOINT, input).toPromise()) as BgsPostMatchStats);
		// Even if stats are computed locally, we still do it on the server so that we can
		// archive the data. However, this is non-blocking
		if (prefs.bgsUseLocalPostMatchStats) {
			// console.log('posting to endpoint');
			this.http.post(BGS_RUN_STATS_ENDPOINT, input).subscribe(
				result => console.log('request remote post-match stats success'),
				error => console.error('issue while posting post-match stats', error),
			);
		}
		console.log('postMatchStats', prefs.bgsUseLocalPostMatchStats, postMatchStats);
		this.stateUpdater.next(new BgsGameEndEvent(postMatchStats));
	}

	private async buildStatsLocally(currentGame: BgsGame): Promise<BgsPostMatchStats> {
		return new Promise<BgsPostMatchStats>(resolve => {
			const worker = new Worker();
			worker.onmessage = (ev: MessageEvent) => {
				// console.log('received worker message', ev);
				worker.terminate();
				resolve(JSON.parse(ev.data));
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
}

interface BgsComputeRunStatsInput {
	readonly reviewId: string;
	readonly battleResultHistory: readonly BattleResultHistory[];
	readonly mainPlayer: BgsPlayer;
}
