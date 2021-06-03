import { EventEmitter, Injectable } from '@angular/core';
import {
	extractTotalDuration,
	extractTotalTurns,
	parseHsReplayString,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
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
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (data) => {
			const info: ManastormInfo = data.data[0];
			const newGameStat: GameStat = this.buildGameStat(info.reviewId, info.game);
			console.log('built new game stat', newGameStat);
			this.stateUpdater.next(new RecomputeGameStatsEvent(newGameStat));
		});
	}

	private buildGameStat(reviewId: string, game: GameForUpload): GameStat {
		const replay = parseHsReplayString(game.uncompressedXmlReplay);
		const durationInSeconds = extractTotalDuration(replay);
		const durationInTurns = extractTotalTurns(replay);
		return GameStat.create({
			additionalResult: game.additionalResult,
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
			newPlayerRank: game.newPlayerRank,
			result: game.result,
			reviewId: reviewId,
			scenarioId: game.scenarioId,
			gameDurationSeconds: durationInSeconds,
			gameDurationTurns: durationInTurns,
			runId: game.runId,
			// xpGained: game.xpGained,
		} as GameStat);
	}
}
