import { EventEmitter, Injectable } from '@angular/core';
import {
	extractTotalDuration,
	extractTotalTurns,
	parseHsReplayString,
	Replay,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { AllCardsService } from '@firestone-hs/reference-data';
import { extractStats } from '@firestone-hs/trigger-process-mercenaries-review';
import { ReviewMessage } from '@firestone-hs/trigger-process-mercenaries-review/dist/review-message';
import { BehaviorSubject } from 'rxjs';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatGameModeType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { CardsFacadeService } from '../../cards-facade.service';
import { Events } from '../../events.service';
import { MainWindowStoreEvent } from '../../mainwindow/store/events/main-window-store-event';
import { RecomputeGameStatsEvent } from '../../mainwindow/store/events/stats/recompute-game-stats-event';
import { GameForUpload } from '../../manastorm-bridge/game-for-upload';
import { ManastormInfo } from '../../manastorm-bridge/manastorm-info';
import { MercenariesReferenceData } from '../../mercenaries/mercenaries-state-builder.service';
import { isMercenaries } from '../../mercenaries/mercenaries-utils';
import { OverwolfService } from '../../overwolf.service';

@Injectable()
export class GameStatsUpdaterService {
	// This is set directly by the store
	public stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private stateEmitter: BehaviorSubject<[MainWindowState, NavigationState]>;

	constructor(
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
	) {
		this.init();
		setTimeout(() => {
			this.stateEmitter = this.ow.getMainWindow().mainWindowStoreMerged;
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
		// console.debug('uncompressedXmlReplay', game.uncompressedXmlReplay, game);
		const replay = parseHsReplayString(game.uncompressedXmlReplay, this.allCards.getService());
		// console.debug('[debug] parsed replay', replay, game);
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
			// Because of Maestra
			opponentClass: this.allCards.getCard(replay.opponentPlayerCardId)?.playerClass?.toLowerCase(),
			opponentName: game.forceOpponentName ?? replay.opponentPlayerName ?? game.opponent?.name,
			opponentRank: game.opponentRank,
			playerCardId: replay.mainPlayerCardId,
			playerClass: this.allCards.getCard(replay.mainPlayerCardId)?.playerClass?.toLowerCase(),
			playerDeckName: game.deckName,
			playerDecklist: game.deckstring,
			playerName: replay.mainPlayerName ?? game.player?.name,
			playerRank: game.playerRank,
			newPlayerRank: game.newPlayerRank,
			result: replay.result,
			reviewId: reviewId,
			scenarioId: game.scenarioId,
			gameDurationSeconds: durationInSeconds,
			gameDurationTurns: durationInTurns,
			runId: game.runId,
			bgsAvailableTribes: game.availableTribes,
			bgsBannedTribes: game.bannedTribes,
			bgsHasPrizes: game.hasBgsPrizes,
			// xpGained: game.xpGained,
		} as GameStat);

		const mainStore = this.stateEmitter?.value;
		if (!isMercenaries(game.gameMode) || !mainStore[0]?.mercenaries?.referenceData) {
			return firstGame;
		}

		const {
			mercHeroTimings,
			mercOpponentHeroTimings,
			mercEquipments,
			mercOpponentEquipments,
		} = await extractHeroTimings(
			firstGame,
			replay,
			mainStore[0]?.mercenaries?.referenceData,
			this.allCards.getService(),
		);

		const gameWithMercStats = firstGame.update({
			mercHeroTimings: mercHeroTimings,
			mercOpponentHeroTimings: mercOpponentHeroTimings,
			mercEquipments: mercEquipments,
			mercOpponentEquipments: mercOpponentEquipments,
		});
		console.debug('built game with merc stas', gameWithMercStats);
		return gameWithMercStats;
	}
}

export const extractHeroTimings = async (
	game: { gameMode: StatGameModeType },
	replay: Replay,
	referenceData: MercenariesReferenceData,
	allCards: AllCardsService,
): Promise<{
	readonly mercHeroTimings: readonly { cardId: string; turnInPlay: number }[];
	readonly mercOpponentHeroTimings: readonly { cardId: string; turnInPlay: number }[];
	readonly mercEquipments: readonly { mercCardId: string; equipmentCardId: string }[];
	readonly mercOpponentEquipments: readonly { mercCardId: string; equipmentCardId: string }[];
}> => {
	const mercStats = await extractStats(game as ReviewMessage, replay, null, referenceData, allCards);
	// console.debug('mercStats', mercStats, game, replay, referenceData, allCards);

	if (!mercStats?.filter((stat) => stat.statName === 'mercs-hero-timing').length) {
		console.log('no hero timings, returning', mercStats);
		return {} as any;
	}

	return {
		mercHeroTimings: mercStats
			.filter((stat) => stat.statName === 'mercs-hero-timing')
			.map((stat) => stat.statValue)
			.map((stat) => {
				const [heroId, timing] = stat.split('|');
				return {
					cardId: heroId,
					turnInPlay: +timing,
				};
			}),
		mercOpponentHeroTimings: mercStats
			.filter((stat) => stat.statName === 'opponent-mercs-hero-timing')
			.map((stat) => stat.statValue)
			.map((stat) => {
				const [heroId, timing] = stat.split('|');
				return {
					cardId: heroId,
					turnInPlay: +timing,
				};
			}),
		mercEquipments: mercStats
			.filter((stat) => stat.statName === 'mercs-hero-equipment')
			.map((stat) => stat.statValue)
			.map((stat) => {
				const [mercCardId, equipmentCardId] = stat.split('|');
				return {
					mercCardId: mercCardId,
					equipmentCardId: equipmentCardId,
				};
			}),
		mercOpponentEquipments: [],
	};
};
