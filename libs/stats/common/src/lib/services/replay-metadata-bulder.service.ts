/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import {
	BgsPostMatchStats,
	extractTotalDuration,
	extractTotalTurns,
	parseBattlegroundsGame,
} from '@firestone-hs/hs-replay-xml-parser';
import { Input as BgsComputeRunStatsInput } from '@firestone-hs/user-bgs-post-match-stats';
import { uuid } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload } from '../model/game-for-upload/game-for-upload';
import { ReplayUploadMetadata } from '../model/replay-upload-metadata';

@Injectable()
export class ReplayMetadataBuilderService {
	constructor(private readonly allCards: CardsFacadeService, private readonly ow: OverwolfService) {}

	public async buildMetadata(
		game: GameForUpload,
		bgsRunStats: BgsComputeRunStatsInput | null,
		userId: string,
		userName: string,
		allowGameShare: boolean,
	): Promise<ReplayUploadMetadata> {
		const today = new Date();
		const replay = game.replay;
		const totalDurationTurns = extractTotalTurns(replay);
		const totalDurationSeconds = extractTotalDuration(replay);
		const bgs: ReplayUploadMetadata['bgs'] | undefined = this.buildBgsMetadata(game, bgsRunStats);
		const version = await this.ow.getAppVersion('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob');
		const metadata: ReplayUploadMetadata = {
			user: {
				userId: userId,
				userName: userName,
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
				reviewId: game.reviewId,
				replayKey: `hearthstone/replay/${today.getFullYear()}/${
					today.getMonth() + 1
				}/${today.getDate()}/${uuid()}.xml.zip`,
				deckstring: game.deckstring,
				deckName: game.deckName,
				scenarioId: game.scenarioId,
				buildNumber: game.buildNumber,
				playerRank: game.playerRank,
				newPlayerRank: game.newPlayerRank,
				opponentRank: game.opponentRank,
				gameMode: game.gameMode,
				gameFormat: game.gameFormat,
				additionalResult:
					game.gameMode === 'battlegrounds' || game.gameMode === 'battlegrounds-friendly'
						? replay.additionalResult
						: game.additionalResult,
				runId: game.runId,

				mainPlayerName: replay.mainPlayerName,
				mainPlayerCardId: replay.mainPlayerCardId,
				opponentPlayerName: replay.opponentPlayerName,
				forceOpponentName: game.forceOpponentName,
				opponentPlayerCardId: replay.opponentPlayerCardId,
				result: replay.result,
				playCoin: replay.playCoin,
				totalDurationSeconds: totalDurationSeconds,
				totalDurationTurns: totalDurationTurns,
			},
			bgs: bgs as ReplayUploadMetadata['bgs'],
		};
		return metadata;
	}

	private buildBgsMetadata(
		game: GameForUpload,
		bgsRunStats: BgsComputeRunStatsInput | null,
	): ReplayUploadMetadata['bgs'] | undefined {
		if (!bgsRunStats || (game.gameMode !== 'battlegrounds' && game.gameMode !== 'battlegrounds-friendly')) {
			return undefined;
		}

		const postMatchStats = parseBattlegroundsGame(
			game.uncompressedXmlReplay,
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
			bannedTribes: game.bannedTribes,
			availableTribes: game.availableTribes,
			mainPlayerId: game.replay.mainPlayerId,
			heroQuests: game.replay.bgsHeroQuests,
			anomalies: game.replay.bgsAnomalies,
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
