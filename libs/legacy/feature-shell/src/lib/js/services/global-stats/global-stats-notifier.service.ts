import { Injectable } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import { extractStatsForGame, mergeStats } from '@firestone-hs/build-global-stats/dist/stats-builder';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload } from '@firestone/stats/common';
import { Events } from '../events.service';
import { GlobalStatsUpdatedEvent } from '../mainwindow/store/events/stats/global/global-stats-updated-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { GlobalStatsService } from './global-stats.service';

@Injectable()
export class GlobalStatsNotifierService {
	constructor(
		private readonly store: MainWindowStoreService,
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly globalStats: GlobalStatsService,
		private readonly allCards: CardsFacadeService,
	) {
		this.init();
	}

	private async init() {
		this.listenForEndGame();
	}

	private async listenForEndGame() {
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (event) => {
			console.debug('[global-stats] Replay created, received info');
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-review') {
				this.updateGlobalStats(info.reviewId, info.game, info.xml);
			}
		});
	}

	private async updateGlobalStats(reviewId: string, game: GameForUpload, xml: string) {
		const currentGlobalStats = this.store.state.globalStats;
		if (game.gameMode?.startsWith('mercenaries')) {
			return currentGlobalStats;
		}
		const message: ReviewMessage = {
			reviewId: reviewId,
			gameMode: game.gameMode,
			replayKey: undefined,
			playerRank: game.playerRank,
			uploaderToken: undefined,
		};
		const statsFromGame = await extractStatsForGame(message, xml, this.allCards.getService());
		if (!statsFromGame?.stats) {
			return currentGlobalStats;
		}
		if (!currentGlobalStats?.stats) {
			return statsFromGame;
		}
		const mergedStats: GlobalStats = mergeStats(currentGlobalStats, statsFromGame);
		this.store.stateUpdater.next(new GlobalStatsUpdatedEvent(mergedStats));
		this.globalStats.updateGlobalStats(mergedStats);
	}
}
