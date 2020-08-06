import { EventEmitter, Injectable } from '@angular/core';
import { parseHsReplayString } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { Events } from '../../events.service';
import { MainWindowStoreEvent } from '../../mainwindow/store/events/main-window-store-event';
import { RecomputeGameStatsEvent } from '../../mainwindow/store/events/stats/recompute-game-stats-event';
import { GameForUpload } from '../../manastorm-bridge/game-for-upload';
import { ManastormInfo } from '../../manastorm-bridge/manastorm-info';

@Injectable()
export class GameStatsUpdaterService {
	// This is set directly by the store
	public stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private events: Events) {
		this.init();
	}

	private init() {
		// Wait until the review is properly uploaded, to avoid showing
		// notifications without substance
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async data => {
			// We do it this way to avoid doing the costly retrieveStats operation as part of
			// the store processing, as it blocks other events
			const info: ManastormInfo = data.data[0];
			const newGameStat: GameStat = this.buildGameStat(info.reviewId, info.game);
			// const gameStats = await this.statsLoader.retrieveStats(data.data[0] ? data.data[0].reviewId : null, 20);
			this.stateUpdater.next(new RecomputeGameStatsEvent(newGameStat));
		});
	}

	private buildGameStat(reviewId: string, game: GameForUpload): GameStat {
		const replay = parseHsReplayString(game.uncompressedXmlReplay);
		return GameStat.create({
			additionalResult: replay.additionalResult,
			buildNumber: game.buildNumber,
			coinPlay: replay.playCoin,
			creationTimestamp: Date.now(),
			gameFormat: game.gameFormat,
			gameMode: game.gameMode,
			opponentCardId: replay.opponentPlayerCardId,
			opponentClass: game.opponent?.class,
			opponentName: game.opponent?.name,
			opponentRank: game.opponentRank,
			playerCardId: replay.mainPlayerCardId,
			playerClass: game.player?.class,
			playerDeckName: game.deckName,
			playerDecklist: game.deckstring,
			playerName: game.player?.name,
			playerRank: game.playerRank,
			result: game.result,
			reviewId: reviewId,
			scenarioId: game.scenarioId,
		} as GameStat);
	}
}
