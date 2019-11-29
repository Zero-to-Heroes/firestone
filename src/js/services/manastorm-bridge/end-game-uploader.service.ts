import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { PlayersInfoService } from '../players-info.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { GameForUpload } from './game-for-upload';
import { GameHelper } from './game-helper.service';
import { GameParserService } from './game-parser.service';
import { ReplayManager } from './replay-manager.service';
import { ReplayUploadService } from './replay-upload.service';

@Injectable()
export class EndGameUploaderService {
	private readonly supportedModesDeckRetrieve = ['practice', 'friendly', 'ranked', 'casual', 'arena', 'tavernbrawl'];

	constructor(
		private logger: NGXLogger,
		private events: Events,
		private ow: OverwolfService,
		private gameHelper: GameHelper,
		private replayManager: ReplayManager,
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
		this.logger.debug('[manastorm-bridge] Uploading game info');
		const game: GameForUpload = await this.initializeGame(
			gameEvent,
			currentReviewId,
			currentGameId,
			deckstring,
			deckName,
			buildNumber,
			scenarioId,
		);
		const savedGame = await this.replayManager.saveLocally(game);
		this.logger.debug('{manastorm-bridge] saved game locally', savedGame.path);
		await this.replayUploadService.uploadGame(savedGame);
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
			this.logger.warn('[manastorm-bridge] could not convert replay');
		}
		this.logger.debug(
			'[manastorm-bridge] Creating new game',
			currentGameId,
			'with replay length',
			replayXml.length,
		);
		const game: GameForUpload = GameForUpload.createEmptyGame(currentGameId);
		this.logger.debug('[manastorm-bridge] Created new game');
		game.reviewId = currentReviewId;
		game.gameFormat = this.gameParserService.toFormatType(gameResult.FormatType);
		this.logger.debug('[manastorm-bridge] parsed format');
		game.gameMode = this.gameParserService.toGameType(gameResult.GameType);
		this.logger.debug('[manastorm-bridge] parsed type');
		game.reviewId = currentReviewId;
		game.buildNumber = buildNumber;
		game.scenarioId = scenarioId;
		if (this.supportedModesDeckRetrieve.indexOf(game.gameMode) !== -1) {
			game.deckstring = deckstring;
			game.deckName = deckName;
		}
		this.logger.debug('[manastorm-bridge] added meta data');
		this.gameHelper.setXmlReplay(game, replayXml);
		this.logger.debug('[manastorm-bridge] set xml replay');
		game.uncompressedXmlReplay = replayXml;
		this.gameParserService.extractMatchup(game);
		this.logger.debug('[manastorm-bridge] extracted matchup');
		this.gameParserService.extractDuration(game);
		this.logger.debug('[manastorm-bridge] extracted duration');

		const [battlegroundsInfo, playerInfo, opponentInfo] = await Promise.all([
			game.gameMode === 'battlegrounds'
				? this.memoryInspection.getBattlegroundsInfo()
				: Promise.resolve(null as BattlegroundsInfo),
			this.playersInfo.getPlayerInfo(),
			this.playersInfo.getOpponentInfo(),
		]);
		this.logger.debug('[manastorm-bridge] retrieved rank info', battlegroundsInfo, playerInfo, game.gameMode, game);
		if (!playerInfo || !opponentInfo) {
			console.error('[manastorm-bridge] no local player info returned by mmindvision', playerInfo, opponentInfo);
		}
		let playerRank;
		if (game.gameMode === 'battlegrounds') {
			playerRank = battlegroundsInfo ? battlegroundsInfo.rating : undefined;
			console.log('updated player rank', playerRank);
		} else if (playerInfo && game.gameFormat === 'standard') {
			if (playerInfo.standardLegendRank > 0) {
				playerRank = `legend-${playerInfo.standardLegendRank}`;
			} else {
				playerRank = playerInfo.standardRank;
			}
		} else if (playerInfo && game.gameFormat === 'wild') {
			if (playerInfo.wildLegendRank > 0) {
				playerRank = `legend-${playerInfo.wildLegendRank}`;
			} else {
				playerRank = playerInfo.wildRank;
			}
		}
		let opponentRank;
		if (opponentInfo && game.gameFormat === 'standard') {
			if (opponentInfo.standardLegendRank > 0) {
				opponentRank = `legend-${opponentInfo.standardLegendRank}`;
			} else {
				opponentRank = opponentInfo.standardRank;
			}
		} else if (opponentInfo && game.gameFormat === 'wild') {
			if (opponentInfo.wildLegendRank > 0) {
				opponentRank = `legend-${opponentInfo.wildLegendRank}`;
			} else {
				opponentRank = opponentInfo.wildRank;
			}
		}
		game.opponentRank = opponentRank;
		game.playerRank = playerRank;
		this.logger.debug('[manastorm-bridge] game ready');
		return game;
	}
}
