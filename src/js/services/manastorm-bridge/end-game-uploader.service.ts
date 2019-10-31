import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { PlayersInfoService } from '../players-info.service';
import { GameForUpload } from './game-for-upload';
import { GameHelper } from './game-helper.service';
import { GameParserService } from './game-parser.service';
import { ManastormInfo } from './manastorm-info';
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
	) {
		this.init();
	}

	private async init() {
		this.listenForEndGame();
	}

	private async listenForEndGame() {
		this.ow.registerInfo(OverwolfService.MANASTORM_ID, result => {
			this.logger.debug('[manastorm-bridge] received manastorm info update', result);
			const info: ManastormInfo = result && result.info ? JSON.parse(result.info) : undefined;
			if (info && info.type === 'new-review') {
				// Here, regularly query the server for the match stats
				this.events.broadcast(Events.REVIEW_FINALIZED, info);
			}
		});
	}

	public async upload(
		gameEvent: GameEvent,
		currentReviewId: string,
		currentGameId: string,
		deckstring: any,
		deckName: string,
		buildNumber: number,
		scenarioId: string,
	): Promise<void> {
		const isManastormRunning = await this.ow.isManastormRunning();
		if (isManastormRunning) {
			// Upload is handled by manastorm
			this.logger.debug('[manastorm-bridge] Manastorm is running, no need to upload');
			return;
		}
		this.logger.debug('[manastorm-bridge] Manastorm not running, uploading game info');
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
		game.reviewId = currentReviewId;
		game.gameFormat = this.gameParserService.toFormatType(gameResult.FormatType);
		game.gameMode = this.gameParserService.toGameType(gameResult.GameType);
		game.reviewId = currentReviewId;
		game.buildNumber = buildNumber;
		game.scenarioId = scenarioId;
		if (this.supportedModesDeckRetrieve.indexOf(game.gameMode) !== -1) {
			game.deckstring = deckstring;
			game.deckName = deckName;
		}
		this.gameHelper.setXmlReplay(game, replayXml);
		game.uncompressedXmlReplay = replayXml;
		this.gameParserService.extractMatchup(game);
		this.gameParserService.extractDuration(game);
		const [playerInfo, opponentInfo] = await Promise.all([
			this.playersInfo.getPlayerInfo(),
			this.playersInfo.getOpponentInfo(),
		]);
		if (!playerInfo || !opponentInfo) {
			console.error('[manastorm-bridge] no local player info returned by mmindvision', playerInfo, opponentInfo);
		}
		let playerRank;
		if (playerInfo && game.gameFormat === 'standard') {
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
		return game;
	}
}
