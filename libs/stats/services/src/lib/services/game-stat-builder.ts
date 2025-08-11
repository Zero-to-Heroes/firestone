import {
	extractTotalDuration,
	extractTotalTurns,
	parseHsReplayString,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { isBattlegrounds, isMercenaries } from '@firestone-hs/reference-data';
import { ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { extractPlayerInfoFromDeckstring, GameStat } from '@firestone/stats/data-access';
import { GameForUpload } from '../models/game-for-upload/game-for-upload';

export const buildGameStat = (
	reviewId: string,
	game: GameForUpload,
	xml: string,
	metadata: ReplayUploadMetadata,
	allCards: CardsFacadeService,
): GameStat => {
	const replay = parseHsReplayString(xml, allCards.getService());
	const durationInSeconds = extractTotalDuration(replay);
	const durationInTurns = extractTotalTurns(replay);

	const { playerClassFromReplay, playerCardIdFromReplay } = {
		playerClassFromReplay: allCards.getCard(replay.mainPlayerCardId)?.playerClass?.toLowerCase(),
		playerCardIdFromReplay: replay.mainPlayerCardId,
	};
	const playerInfoFromDeckstring = extractPlayerInfoFromDeckstring(game.deckstring, allCards, game.gameMode);

	const mainPlayerClass = playerInfoFromDeckstring?.playerClass ?? playerClassFromReplay;
	let playerCardId = playerCardIdFromReplay;
	if (
		mainPlayerClass !== allCards.getCard(replay.mainPlayerCardId)?.playerClass?.toLowerCase() &&
		!!playerInfoFromDeckstring?.playerCardId
	) {
		playerCardId = playerInfoFromDeckstring?.playerCardId;
	}

	const quests = isBattlegrounds(replay.gameType) ? (replay.bgsHeroQuests ?? []) : [];
	const firstGame = GameStat.create({
		additionalResult: game.additionalResult ?? undefined,
		buildNumber: game.buildNumber,
		region: replay.region,
		coinPlay: replay.playCoin,
		creationTimestamp: Date.now(),
		gameFormat: game.gameFormat,
		gameMode: game.gameMode,
		opponentCardId: replay.opponentPlayerCardId,
		// Because of Maestra
		opponentClass: allCards.getCard(replay.opponentPlayerCardId)?.playerClass?.toLowerCase(),
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
		runId: game.runId ?? undefined,
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
};
