import { Injectable } from '@angular/core';
import { GameEvent } from '../../models/game-event';
import { PlayersInfoService } from '../players-info.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { GameForUpload } from './game-for-upload';
import { GameHelper } from './game-helper.service';
import { GameParserService } from './game-parser.service';
import { ReplayUploadService } from './replay-upload.service';

@Injectable()
export class EndGameUploaderService {
	private readonly supportedModesDeckRetrieve = ['practice', 'friendly', 'ranked', 'casual', 'arena', 'tavernbrawl'];

	constructor(
		private gameHelper: GameHelper,
		private replayUploadService: ReplayUploadService,
		private gameParserService: GameParserService,
		private playersInfo: PlayersInfoService,
		private memoryInspection: MemoryInspectionService,
	) {}

	public async upload(
		gameEvent: GameEvent,
		currentReviewId: string,
		currentGameId: string,
		deckstring: any,
		deckName: string,
		buildNumber: number,
		scenarioId: string,
	): Promise<void> {
		console.log('[manastorm-bridge] Uploading game info');
		const game: GameForUpload = await this.initializeGame(
			gameEvent,
			currentReviewId,
			currentGameId,
			deckstring,
			deckName,
			buildNumber,
			scenarioId,
		);
		await this.replayUploadService.uploadGame(game);
	}

	private async initializeGame(
		gameEvent: GameEvent,
		currentReviewId: string,
		currentGameId: string,
		deckstring: any,
		deckName: string,
		buildNumber: number,
		scenarioId: string,
	): Promise<GameForUpload> {
		const gameResult = gameEvent.additionalData.game;
		const replayXml = gameEvent.additionalData.replayXml;
		if (!replayXml) {
			console.warn('[manastorm-bridge] could not convert replay');
		}
		console.log('[manastorm-bridge] Creating new game', currentGameId, 'with replay length', replayXml.length);
		const game: GameForUpload = GameForUpload.createEmptyGame(currentGameId);
		console.log('[manastorm-bridge] Created new game');
		game.reviewId = currentReviewId;
		game.gameFormat = this.gameParserService.toFormatType(gameResult.FormatType);
		console.log('[manastorm-bridge] parsed format');
		game.gameMode = this.gameParserService.toGameType(gameResult.GameType);
		console.log('[manastorm-bridge] parsed type');
		game.reviewId = currentReviewId;
		game.buildNumber = buildNumber;
		game.scenarioId = scenarioId;
		if (this.supportedModesDeckRetrieve.indexOf(game.gameMode) !== -1) {
			game.deckstring = deckstring;
			game.deckName = deckName;
		}
		console.log('[manastorm-bridge] added meta data');
		this.gameHelper.setXmlReplay(game, replayXml);
		console.log('[manastorm-bridge] set xml replay');
		game.uncompressedXmlReplay = replayXml;
		this.gameParserService.extractMatchup(game);
		console.log('[manastorm-bridge] extracted matchup');
		this.gameParserService.extractDuration(game);
		console.log('[manastorm-bridge] extracted duration');

		let playerRank;
		if (game.gameMode === 'battlegrounds') {
			const battlegroundsInfo = await this.memoryInspection.getBattlegroundsInfo();
			playerRank = battlegroundsInfo ? battlegroundsInfo.rating : undefined;
			console.log('updated player rank', playerRank);
		} else if (game.gameMode === 'arena') {
			const arenaInfo = await this.memoryInspection.getArenaInfo();
			playerRank = arenaInfo ? arenaInfo.wins + '-' + arenaInfo.losses : undefined;
			console.log('updated player rank for arena', playerRank);
		} else if (game.gameFormat === 'standard' || game.gameFormat === 'wild') {
			const playerInfo = await this.playersInfo.getPlayerInfo();
			if (playerInfo && game.gameFormat === 'standard') {
				if (playerInfo.standard?.legendRank > 0) {
					playerRank = `legend-${playerInfo.standard.legendRank}`;
				} else {
					playerRank = `${playerInfo.standard.leagueId}-${playerInfo.standard?.rankValue}`;
				}
			} else if (playerInfo && game.gameFormat === 'wild') {
				if (playerInfo.wild?.legendRank > 0) {
					playerRank = `legend-${playerInfo.wild.legendRank}`;
				} else {
					playerRank = `${playerInfo.wild.leagueId}-${playerInfo.wild?.rankValue}`;
				}
			}
		}
		let opponentRank;
		if (game.gameFormat === 'standard' || game.gameFormat === 'wild') {
			const opponentInfo = await this.playersInfo.getOpponentInfo();
			if (opponentInfo && game.gameFormat === 'standard') {
				if (opponentInfo.standard?.legendRank > 0) {
					opponentRank = `legend-${opponentInfo.standard.legendRank}`;
				} else {
					opponentRank = `${opponentInfo.standard.leagueId}-${opponentInfo.standard?.rankValue}`;
				}
			} else if (opponentInfo && game.gameFormat === 'wild') {
				if (opponentInfo.wild?.legendRank > 0) {
					opponentRank = `legend-${opponentInfo.wild.legendRank}`;
				} else {
					opponentRank = `${opponentInfo.wild.leagueId}-${opponentInfo.wild?.rankValue}`;
				}
			}
		}
		game.opponentRank = opponentRank;
		game.playerRank = playerRank;
		console.log('[manastorm-bridge] game ready');
		return game;
	}
}
