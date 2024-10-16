/* eslint-disable no-mixed-spaces-and-tabs */
import { Inject, Injectable } from '@angular/core';
import {
	BgsPostMatchStats,
	extractTotalDuration,
	extractTotalTurns,
	parseBattlegroundsGame,
} from '@firestone-hs/hs-replay-xml-parser';
import { ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { Input as BgsComputeRunStatsInput } from '@firestone-hs/user-bgs-post-match-stats';
import { ADS_SERVICE_TOKEN, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload } from '../model/game-for-upload/game-for-upload';
import { MatchAnalysisService } from './match-analysis.service';

import { IAdsService } from '@firestone/shared/framework/core';

@Injectable()
export class ReplayMetadataBuilderService {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		private readonly matchAnalysisService: MatchAnalysisService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {}

	public async buildMetadata(
		game: GameForUpload,
		xml: string,
		bgsRunStats: BgsComputeRunStatsInput | null,
		userId: string,
		userName: string,
		allowGameShare: boolean,
	): Promise<ReplayUploadMetadata> {
		const today = new Date();
		const replay = game.replay;
		const totalDurationTurns = extractTotalTurns(replay);
		const totalDurationSeconds = extractTotalDuration(replay);
		const bgs: ReplayUploadMetadata['bgs'] | undefined = this.buildBgsMetadata(game, xml, bgsRunStats);
		const version = await this.ow.getAppVersion('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob');
		const isPremium = this.ads.hasPremiumSub$$.getValue();
		const newSuffix = !userName?.length ? 'anonymous' : isPremium ? 'premium' : 'logged-in';
		const replayKey = `hearthstone/replay-${newSuffix}/${today.getUTCFullYear()}/${
			today.getUTCMonth() + 1
		}/${today.getUTCDate()}/${game.reviewId}.xml.zip`;
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
					: this.allCards.getService().normalizeDeckList(game.deckstring),
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
				matchAnalysis: this.matchAnalysisService.buildMatchStats(game),
				playerPlayedCards: this.matchAnalysisService.buildCardsPlayed(game.replay.mainPlayerId, game.replay),
				opponentPlayedCards: this.matchAnalysisService.buildCardsPlayed(
					game.replay.opponentPlayerId,
					game.replay,
				),
			},
		};
		return metadata;
	}

	private buildBgsMetadata(
		game: GameForUpload,
		xml: string,
		bgsRunStats: BgsComputeRunStatsInput | null,
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
			finalComp: postMatchStats?.boardHistory?.length
				? postMatchStats.boardHistory[postMatchStats.boardHistory.length - 1]
				: null,
			battleOdds: !!game.bgBattleOdds?.length ? game.bgBattleOdds : null,
			warbandStats: warbandStats,
			postMatchStats: finalPostMatchStats,
			isPerfectGame: isBgPerfectGame(postMatchStats, game.additionalResult, game.replay.mainPlayerId),
		};
	}
}

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
