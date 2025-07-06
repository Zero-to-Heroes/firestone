/* eslint-disable no-mixed-spaces-and-tabs */
import { Inject, Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import {
	BgsBoard,
	BgsPostMatchStats,
	CardsPlayedByTurnParser,
	extractTotalDuration,
	extractTotalTurns,
	parseBattlegroundsGame,
	parseGame,
} from '@firestone-hs/hs-replay-xml-parser';
import { BgsBoardLight, EntityLight, ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { Input as BgsComputeRunStatsInput } from '@firestone-hs/user-bgs-post-match-stats';
import { ADS_SERVICE_TOKEN, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload } from '../model/game-for-upload/game-for-upload';
import { MatchAnalysisService } from './match-analysis.service';

import { isMercenaries } from '@firestone-hs/reference-data';
import { PatchesConfigService, PatchInfo } from '@firestone/shared/common/service';
import { IAdsService } from '@firestone/shared/framework/core';
import { assignCompArchetype } from './bgs/comps';

@Injectable()
export class ReplayMetadataBuilderService {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		private readonly matchAnalysisService: MatchAnalysisService,
		private readonly patches: PatchesConfigService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {}

	public async buildMetadata(
		game: GameForUpload,
		xml: string,
		bgsRunStats: BgsComputeRunStatsInput | null,
		comps: readonly BgsCompAdvice[] | null,
		userId: string,
		userName: string,
		allowGameShare: boolean,
	): Promise<ReplayUploadMetadata> {
		const today = new Date();
		const replay = game.replay;
		const totalDurationTurns = extractTotalTurns(replay);
		const totalDurationSeconds = extractTotalDuration(replay);
		const currentBgPatch = await this.patches.currentBattlegroundsMetaPatch$$.getValueWithInit();
		const bgs: ReplayUploadMetadata['bgs'] | undefined = this.buildBgsMetadata(
			game,
			xml,
			bgsRunStats,
			comps,
			currentBgPatch,
		);
		const version = await this.ow.getAppVersion('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob');
		const isPremium = this.ads.hasPremiumSub$$.getValue();
		const newSuffix = !userName?.length ? 'anonymous' : isPremium ? 'premium' : 'logged-in';
		const replayKey = `hearthstone/replay-${newSuffix}/${today.getUTCFullYear()}/${
			today.getUTCMonth() + 1
		}/${today.getUTCDate()}/${game.reviewId}.xml.zip`;
		const matchAnalysis = this.matchAnalysisService.buildMatchStats(game);

		const parser = new CardsPlayedByTurnParser();
		parseGame(replay, [parser]);
		const playerPlayedCardsByTurn = parser.cardsPlayedByTurn[game.replay.mainPlayerId];
		const playerCastCardsByTurn = parser.cardsCastByTurn[game.replay.mainPlayerId];
		console.debug('deckstring', game.deckstring);

		const metadata: ReplayUploadMetadata = {
			user: {
				userId: userId,
				userName: userName,
				isPremium: isPremium,
			},
			meta: {
				application: `firestone-${version}`,
				appVersion: version,
				appChannel: '' + process.env['APP_CHANNEL'],
				region: replay.region,
				allowGameShare: allowGameShare,
				realXpGained: game.xpForGame?.realXpGained,
				normalizedXpGained: game.xpForGame?.xpGainedWithoutBonus,
				levelAfterMatch: game.xpForGame ? game.xpForGame.currentLevel + '-' + game.xpForGame.currentXp : '',
			},
			game: {
				uniqueId: game.uniqueId,
				reviewId: game.reviewId,
				replayKey: replayKey,
				deckstring: game.deckstring,
				normalizedDeckstring: !game.deckstring?.length
					? null
					: isMercenaries(game.gameMode)
					? game.deckstring
					: normalizeDeckstring(game.deckstring, this.allCards),
				deckName: game.deckName,
				scenarioId: game.scenarioId,
				buildNumber: game.buildNumber,
				playerRank: game.playerRank,
				newPlayerRank: game.newPlayerRank,
				seasonId: game.seasonId ?? 0,
				opponentRank: game.opponentRank,
				gameMode: game.gameMode,
				gameFormat: game.gameFormat,
				additionalResult:
					game.gameMode === 'battlegrounds' ||
					game.gameMode === 'battlegrounds-friendly' ||
					game.gameMode === 'battlegrounds-duo'
						? replay.additionalResult
						: game.additionalResult,
				runId: game.runId,

				mainPlayerName: replay.mainPlayerName,
				mainPlayerCardId: replay.mainPlayerCardId,
				mainPlayerId: game.replay.mainPlayerId,
				opponentPlayerName: replay.opponentPlayerName,
				forceOpponentName: game.forceOpponentName,
				opponentPlayerCardId: replay.opponentPlayerCardId,
				opponentPlayerId: game.replay.opponentPlayerId,
				result: replay.result,
				playCoin: replay.playCoin,
				totalDurationSeconds: totalDurationSeconds,
				totalDurationTurns: totalDurationTurns,
			},
			bgs: bgs as ReplayUploadMetadata['bgs'],
			stats: {
				matchAnalysis: matchAnalysis,
				playerPlayedCards: playerPlayedCardsByTurn?.map((c) => c.cardId),
				playerPlayedCardsByTurn: playerPlayedCardsByTurn,
				playerCastCardsByTurn: playerCastCardsByTurn,
				opponentPlayedCards: parser.cardsPlayedByTurn[game.replay.opponentPlayerId]?.map((c) => c.cardId),
				opponentPlayedCardsByTurn: parser.cardsPlayedByTurn[game.replay.opponentPlayerId],
				opponentCastCardsByTurn: parser.cardsCastByTurn[game.replay.opponentPlayerId],
			},
		};
		return metadata;
	}

	private buildBgsMetadata(
		game: GameForUpload,
		xml: string,
		bgsRunStats: BgsComputeRunStatsInput | null,
		comps: readonly BgsCompAdvice[] | null,
		currentBgPatch: PatchInfo | null,
	): ReplayUploadMetadata['bgs'] | undefined {
		if (
			!bgsRunStats ||
			(game.gameMode !== 'battlegrounds' &&
				game.gameMode !== 'battlegrounds-friendly' &&
				game.gameMode !== 'battlegrounds-duo')
		) {
			return undefined;
		}

		const postMatchStats = parseBattlegroundsGame(
			xml,
			bgsRunStats.mainPlayer,
			bgsRunStats.battleResultHistory,
			bgsRunStats.faceOffs,
			this.allCards.getService(),
		);

		const warbandStats = buildWarbandStats(postMatchStats);
		const finalPostMatchStats: any =
			postMatchStats == null
				? null
				: {
						...postMatchStats,
						oldMmr: game.playerRank,
						newMmr: game.newPlayerRank,
				  };
		const boardHistory: readonly BgsBoardLight[] = buildBoardHistory(postMatchStats.boardHistory);
		const finalComp = postMatchStats?.boardHistory?.length
			? postMatchStats.boardHistory[postMatchStats.boardHistory.length - 1]
			: null;
		const compArchetype = assignCompArchetype(comps, finalComp, this.allCards, currentBgPatch);
		return {
			hasPrizes: game.hasBgsPrizes,
			hasSpells: game.hasBgsSpells,
			hasQuests: game.replay.hasBgsQuests,
			hasAnomalies: game.replay.hasBgsAnomalies,
			hasTrinkets: game.replay.hasBgsTrinkets,
			heroesOffered: postMatchStats.heroesOffered,
			bannedTribes: game.bannedTribes,
			availableTribes: game.availableTribes,
			mainPlayerId: game.replay.mainPlayerId,
			heroQuests: game.replay.bgsHeroQuests,
			anomalies: game.replay.bgsAnomalies,
			trinkets: game.replay.bgsHeroTrinkets,
			trinketsOffered: game.replay.bgsHeroTrinketsOffered,
			finalComp: finalComp,
			compArchetype: compArchetype,
			battleOdds: !!game.bgBattleOdds?.length ? game.bgBattleOdds : null,
			warbandStats: warbandStats,
			postMatchStats: finalPostMatchStats,
			boardHistory: boardHistory,
			isPerfectGame: isBgPerfectGame(postMatchStats, game.additionalResult, game.replay.mainPlayerId),
		};
	}
}

const buildBoardHistory = (boardHistory: readonly BgsBoard[]): readonly BgsBoardLight[] => {
	return boardHistory?.map((board) => {
		const result: BgsBoardLight = {
			turn: board.turn,
			board: board.board.map((entity) => {
				const tags: { [tagName: string]: number } = {};
				for (const tag of entity.tags) {
					tags[tag[0]] = tag[1];
				}
				const entityLight: EntityLight = {
					cardID: entity.cardID,
					id: entity.id,
					tags: tags,
				};
				return entityLight;
			}),
		};
		return result;
	});
};

const buildWarbandStats = (bgParsedInfo: BgsPostMatchStats): ReplayUploadMetadata['bgs']['warbandStats'] | null => {
	try {
		const result = bgParsedInfo.totalStatsOverTurn.map((stat) => ({
			turn: stat.turn,
			totalStats: stat.value,
		}));
		console.debug('built warband stats', result);
		return result;
	} catch (e) {
		console.error('Exception while building warband stats', e);
		return null;
	}
};

const isBgPerfectGame = (bgParsedInfo: BgsPostMatchStats, additionalResult: string, mainPlayerId: number): boolean => {
	if (!additionalResult || parseInt(additionalResult) !== 1) {
		return false;
	}

	const mainPlayerHpOverTurn = bgParsedInfo.hpOverTurn[mainPlayerId];
	// Let's use 8 turns as a minimum to be considered a perfect game
	if (!mainPlayerHpOverTurn?.length || mainPlayerHpOverTurn.length < 8) {
		return false;
	}

	const maxHp = Math.max(...mainPlayerHpOverTurn.map((info) => info.value));
	const startingHp = maxHp;
	const endHp = mainPlayerHpOverTurn[mainPlayerHpOverTurn.length - 1].value;
	return endHp === startingHp;
};

const normalizeDeckstring = (deckstring: string, allCards: CardsFacadeService): string => {
	try {
		return allCards.getService().normalizeDeckList(deckstring);
	} catch (e) {
		return deckstring;
	}
};
