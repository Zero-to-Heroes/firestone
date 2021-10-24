import { EventEmitter, Injectable } from '@angular/core';
import {
	extractTotalDuration,
	extractTotalTurns,
	parseHsReplayString,
	Replay,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { AllCardsService } from '@firestone-hs/reference-data';
import { extractStats } from '@firestone-hs/trigger-process-mercenaries-review';
import { BehaviorSubject } from 'rxjs';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatGameModeType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { CardsFacadeService } from '../../cards-facade.service';
import { Events } from '../../events.service';
import { MainWindowStoreEvent } from '../../mainwindow/store/events/main-window-store-event';
import { RecomputeGameStatsEvent } from '../../mainwindow/store/events/stats/recompute-game-stats-event';
import { GameForUpload } from '../../manastorm-bridge/game-for-upload';
import { ManastormInfo } from '../../manastorm-bridge/manastorm-info';
import { MercenariesReferenceData } from '../../mercenaries/mercenaries-state-builder.service';
import { OverwolfService } from '../../overwolf.service';

@Injectable()
export class GameStatsUpdaterService {
	// This is set directly by the store
	public stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private stateEmitter: BehaviorSubject<MainWindowState>;

	constructor(
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
	) {
		this.init();
		setTimeout(() => {
			this.stateEmitter = this.ow.getMainWindow().mainWindowStore;
		});
	}

	private init() {
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (data) => {
			const info: ManastormInfo = data.data[0];
			const newGameStat: GameStat = await this.buildGameStat(info.reviewId, info.game);
			console.log('built new game stat', newGameStat);
			this.stateUpdater.next(new RecomputeGameStatsEvent(newGameStat));
		});
	}

	private async buildGameStat(reviewId: string, game: GameForUpload): Promise<GameStat> {
		const replay = parseHsReplayString(game.uncompressedXmlReplay);
		const durationInSeconds = extractTotalDuration(replay);
		const durationInTurns = extractTotalTurns(replay);

		const firstGame = GameStat.create({
			additionalResult: game.additionalResult,
			buildNumber: game.buildNumber,
			coinPlay: replay.playCoin,
			creationTimestamp: Date.now(),
			gameFormat: game.gameFormat,
			gameMode: game.gameMode,
			opponentCardId: replay.opponentPlayerCardId,
			opponentClass: game.opponent?.class,
			opponentName: game.forceOpponentName ?? game.opponent?.name,
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

		const mainStore = this.stateEmitter?.value;
		if (!mainStore?.mercenaries?.referenceData) {
			return firstGame;
		}

		const [mercHeroTimings, mercOpponentHeroTimings] = await extractHeroTimings(
			firstGame,
			replay,
			game.uncompressedXmlReplay,
			mainStore?.mercenaries?.referenceData,
			this.allCards.getService(),
		);
		if (!mercHeroTimings || !mercOpponentHeroTimings) {
			return firstGame;
		}

		const gameWithMercStats = firstGame.update({
			mercHeroTimings: mercHeroTimings,
			mercOpponentHeroTimings: mercOpponentHeroTimings,
		});
		console.debug('built game with merc stas', gameWithMercStats);
		return gameWithMercStats;
	}
}

export const extractHeroTimings = async (
	game: { gameMode: StatGameModeType },
	replay: Replay,
	xml: string,
	referenceData: MercenariesReferenceData,
	allCards: AllCardsService,
): Promise<[readonly { cardId: string; turnInPlay: number }[], readonly { cardId: string; turnInPlay: number }[]]> => {
	const mercStats = await extractStats(game as any, replay, xml, referenceData, allCards);

	if (!mercStats?.filter((stat) => stat.statName === 'mercs-hero-timing').length) {
		console.log('no hero timings, returning', mercStats);
		return [null, null];
	}

	return [
		mercStats
			.filter((stat) => stat.statName === 'mercs-hero-timing')
			.map((stat) => stat.statValue)
			.map((stat) => {
				const [heroId, timing] = stat.split('|');
				return {
					cardId: heroId,
					turnInPlay: +timing,
				};
			}),
		mercStats
			.filter((stat) => stat.statName === 'opponent-mercs-hero-timing')
			.map((stat) => stat.statValue)
			.map((stat) => {
				const [heroId, timing] = stat.split('|');
				return {
					cardId: heroId,
					turnInPlay: +timing,
				};
			}),
	];
};
