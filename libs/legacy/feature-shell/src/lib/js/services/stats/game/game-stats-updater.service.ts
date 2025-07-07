import { EventEmitter, Injectable } from '@angular/core';
import {
	extractTotalDuration,
	extractTotalTurns,
	parseHsReplayString,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload } from '@firestone/stats/common';
import { extractPlayerInfoFromDeckstring, GameStat } from '@firestone/stats/data-access';
import { BehaviorSubject } from 'rxjs';

import { ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { isBattlegrounds } from '../../battlegrounds/bgs-utils';
import { Events } from '../../events.service';
import { MainWindowStoreEvent } from '../../mainwindow/store/events/main-window-store-event';
import { RecomputeGameStatsEvent } from '../../mainwindow/store/events/stats/recompute-game-stats-event';
import { ManastormInfo } from '../../manastorm-bridge/manastorm-info';
import { MercenariesReferenceDataService } from '../../mercenaries/mercenaries-reference-data.service';
import { isMercenaries } from '../../mercenaries/mercenaries-utils';

@Injectable()
export class GameStatsUpdaterService {
	// This is set directly by the store
	public stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private stateEmitter: BehaviorSubject<[MainWindowState, NavigationState]>;

	constructor(
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
	) {
		this.init();
		setTimeout(() => {
			this.stateEmitter = this.ow.getMainWindow().mainWindowStoreMerged;
		});
	}

	private async init() {
		// For now we keep the main store as the source of truth, but maybe this should be moved away at some point?
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (data) => {
			const info: ManastormInfo = data.data[0];
			const newGameStat: GameStat = await this.buildGameStat(info.reviewId, info.game, info.xml, info.metadata);
			console.log('​[manastorm-bridge] built new game stat', newGameStat.reviewId);
			console.debug('​[manastorm-bridge] built new game stat', newGameStat);
			this.stateUpdater.next(new RecomputeGameStatsEvent(newGameStat));
		});
	}

	private async buildGameStat(
		reviewId: string,
		game: GameForUpload,
		xml: string,
		metadata: ReplayUploadMetadata,
	): Promise<GameStat> {
		const replay = parseHsReplayString(xml, this.allCards.getService());
		const durationInSeconds = extractTotalDuration(replay);
		const durationInTurns = extractTotalTurns(replay);

		const { playerClassFromReplay, playerCardIdFromReplay } = {
			playerClassFromReplay: this.allCards.getCard(replay.mainPlayerCardId)?.playerClass?.toLowerCase(),
			playerCardIdFromReplay: replay.mainPlayerCardId,
		};
		const playerInfoFromDeckstring = extractPlayerInfoFromDeckstring(game.deckstring, this.allCards, game.gameMode);

		const mainPlayerClass = playerInfoFromDeckstring?.playerClass ?? playerClassFromReplay;
		let playerCardId = playerCardIdFromReplay;
		if (
			mainPlayerClass !== this.allCards.getCard(replay.mainPlayerCardId)?.playerClass?.toLowerCase() &&
			!!playerInfoFromDeckstring?.playerCardId
		) {
			playerCardId = playerInfoFromDeckstring?.playerCardId;
		}

		const quests = isBattlegrounds(replay.gameType) ? replay.bgsHeroQuests ?? [] : [];
		const firstGame = GameStat.create({
			additionalResult: game.additionalResult,
			buildNumber: game.buildNumber,
			region: replay.region,
			coinPlay: replay.playCoin,
			creationTimestamp: Date.now(),
			gameFormat: game.gameFormat,
			gameMode: game.gameMode,
			opponentCardId: replay.opponentPlayerCardId,
			// Because of Maestra
			opponentClass: this.allCards.getCard(replay.opponentPlayerCardId)?.playerClass?.toLowerCase(),
			opponentName: game.forceOpponentName ?? replay.opponentPlayerName ?? game.opponent?.name,
			opponentRank: game.opponentRank,
			playerCardId: playerCardId,
			playerClass: mainPlayerClass,
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
			bgsHasSpells: game.hasBgsSpells,
			bgsHasQuests: replay.hasBgsQuests,
			bgsHeroQuests: quests.map((q) => q.questCardId) as readonly string[],
			bgsQuestsCompletedTimings: quests.map((q) => q.turnCompleted) as readonly number[],
			bgsHeroQuestRewards: quests.map((q) => q.rewardCardId) as readonly string[],
			bgsAnomalies: game.bgsAnomalies,
			bgsTrinkets: metadata.bgs?.trinkets?.map((t) => t.cardId) ?? [],
			bgsCompArchetype: metadata.bgs?.compArchetype,
			finalComp: GameStat.encodeBgsFinalComp(metadata.bgs?.finalComp),
		});

		if (!isMercenaries(game.gameMode)) {
			return firstGame;
		}

		return firstGame;
	}
}
