import {
	BgsBoard,
	extractTotalDuration,
	extractTotalTurns,
	parseHsReplayString,
	Replay,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { isBattlegrounds, isMercenaries } from '@firestone-hs/reference-data';
import { ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { extractPlayerInfoFromDeckstring, GameStat } from '@firestone/stats/data-access';
import { deflate, inflate } from 'pako';
import { GameForUpload } from '../models/game-for-upload/game-for-upload';
import { ReplayEssentials } from '../models/replay-essentials';

export const buildGameStat = (
	reviewId: string,
	game: GameForUpload,
	xml: string,
	metadata: ReplayUploadMetadata,
	allCards: CardsFacadeService,
): GameStat => {
	// The uploader already extracted this exact XML into game.replayEssentials (worker
	// parse, Plan H phase 2) or game.replay; re-parsing an 8MB+ replay here used to
	// block the main thread for seconds (Plan H). Both types share the field names
	// used below.
	const essentials = game.replayEssentials;
	let src: ReplayEssentials | Replay;
	let durationInSeconds: number;
	let durationInTurns: number;
	if (essentials) {
		src = essentials;
		durationInSeconds = essentials.totalDurationSeconds;
		durationInTurns = essentials.totalDurationTurns;
	} else {
		const replay = game.replay ?? parseHsReplayString(xml, allCards.getService());
		src = replay;
		durationInSeconds = extractTotalDuration(replay);
		durationInTurns = extractTotalTurns(replay);
	}

	const { playerClassFromReplay, playerCardIdFromReplay } = {
		playerClassFromReplay: allCards.getCard(src.mainPlayerCardId)?.playerClass?.toLowerCase(),
		playerCardIdFromReplay: src.mainPlayerCardId,
	};
	const playerInfoFromDeckstring = extractPlayerInfoFromDeckstring(game.deckstring, allCards, game.gameMode);

	const mainPlayerClass = playerInfoFromDeckstring?.playerClass ?? playerClassFromReplay;
	let playerCardId = playerCardIdFromReplay;
	if (
		mainPlayerClass !== allCards.getCard(src.mainPlayerCardId)?.playerClass?.toLowerCase() &&
		!!playerInfoFromDeckstring?.playerCardId
	) {
		playerCardId = playerInfoFromDeckstring?.playerCardId;
	}

	const quests = isBattlegrounds(src.gameType) ? (src.bgsHeroQuests ?? []) : [];
	const firstGame = GameStat.create({
		additionalResult: game.additionalResult ?? undefined,
		buildNumber: game.buildNumber,
		region: src.region,
		coinPlay: src.playCoin,
		creationTimestamp: Date.now(),
		gameFormat: game.gameFormat,
		gameMode: game.gameMode,
		opponentCardId: src.opponentPlayerCardId,
		// Because of Maestra
		opponentClass: allCards.getCard(src.opponentPlayerCardId)?.playerClass?.toLowerCase(),
		opponentName: game.forceOpponentName ?? src.opponentPlayerName ?? game.opponent?.name,
		opponentRank: game.opponentRank,
		playerCardId: playerCardId,
		playerClass: mainPlayerClass,
		playerDeckName: game.deckName,
		playerDecklist: isMercenaries(game.gameMode)
			? game.deckstring
			: (allCards.normalizeDeckList(game.deckstring) ?? game.deckstring),
		playerName: src.mainPlayerName ?? game.player?.name,
		playerRank: game.playerRank,
		newPlayerRank: game.newPlayerRank,
		result: src.result,
		reviewId: reviewId,
		powerLogKey: metadata.game.powerLogKey,
		scenarioId: game.scenarioId,
		gameDurationSeconds: durationInSeconds,
		gameDurationTurns: durationInTurns,
		runId: game.runId ?? undefined,
		bgsAvailableTribes: game.availableTribes,
		bgsBannedTribes: game.bannedTribes,
		bgsHasPrizes: game.hasBgsPrizes,
		bgsHasSpells: game.hasBgsSpells,
		bgsHasQuests: src.hasBgsQuests,
		bgsHeroQuests: quests.map((q) => q.questCardId) as readonly string[],
		bgsQuestsCompletedTimings: quests.map((q) => q.turnCompleted) as readonly number[],
		bgsHeroQuestRewards: quests.map((q) => q.rewardCardId) as readonly string[],
		bgsAnomalies: game.bgsAnomalies,
		bgsTrinkets: metadata.bgs?.trinkets?.map((t) => t.cardId) ?? [],
		bgsCompArchetype: metadata.bgs?.compArchetype,
		finalComp: encodeBgsFinalComp(metadata.bgs?.finalComp),
		cardsAnalysis: metadata.stats?.matchAnalysis?.cardsAnalysis ?? null,
	});

	if (!isMercenaries(game.gameMode)) {
		return firstGame;
	}

	return firstGame;
};

// eslint-disable-next-line @typescript-eslint/member-ordering
export const encodeBgsFinalComp = (finalComp: BgsBoard | null | undefined): string | undefined => {
	if (!finalComp?.board?.length) {
		return undefined;
	}

	console.debug('[game-stat] encoding finalComp', finalComp);
	const compressedStats = deflate(JSON.stringify(finalComp));
	const base64data = Buffer.from(compressedStats).toString('base64');
	return base64data;
};

// eslint-disable-next-line @typescript-eslint/member-ordering
export const decodeBgsFinalComp = (finalComp: string | null | undefined): BgsBoard | null => {
	if (!finalComp?.length) {
		return null;
	}

	const compressedStats = Buffer.from(finalComp, 'base64');
	const stats = inflate(new Uint8Array(compressedStats), { to: 'string' });
	return JSON.parse(stats);
};
