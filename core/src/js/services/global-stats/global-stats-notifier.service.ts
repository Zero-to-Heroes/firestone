import { Injectable } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import { extractStatsForGame, mergeStats } from '@firestone-hs/build-global-stats/dist/stats-builder';
import { Events } from '../events.service';
import { GlobalStatsUpdatedEvent } from '../mainwindow/store/events/stats/global/global-stats-updated-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { GameForUpload } from '../manastorm-bridge/game-for-upload';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';
import { GlobalStatsService } from './global-stats.service';

@Injectable()
export class GlobalStatsNotifierService {
	constructor(
		private readonly store: MainWindowStoreService,
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly globalStats: GlobalStatsService,
	) {
		this.init();
	}

	private async init() {
		this.listenForEndGame();
	}

	private async listenForEndGame() {
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (event) => {
			console.log('[global-stats] Replay created, received info');
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-review') {
				this.updateGlobalStats(info.reviewId, info.game);
			}
		});
	}

	private async updateGlobalStats(reviewId: string, game: GameForUpload) {
		const currentGlobalStats = this.store.state.globalStats;
		const message: ReviewMessage = {
			reviewId: reviewId,
			gameMode: game.gameMode,
			replayKey: undefined,
			playerRank: game.playerRank,
			uploaderToken: undefined,
		};
		const statsFromGame = await extractStatsForGame(message, game.uncompressedXmlReplay);
		if (!statsFromGame?.stats) {
			return currentGlobalStats;
		}
		if (!currentGlobalStats?.stats) {
			return statsFromGame;
		}
		//console.log('[global-stats] built stats', statsFromGame, currentGlobalStats);
		const mergedStats: GlobalStats = mergeStats(currentGlobalStats, statsFromGame);
		//console.log('[global-stats] merged stats', mergedStats);
		this.store.stateUpdater.next(new GlobalStatsUpdatedEvent(mergedStats));
	}
}
