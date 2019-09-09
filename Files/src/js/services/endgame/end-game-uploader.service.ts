import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameEvent } from '../../models/game-event';
import { OverwolfService } from '../overwolf.service';
import { GameForUpload } from './game-for-upload';
import { GameHelper } from './game-helper.service';
import { GameParserService } from './game-parser.service';
import { ReplayUploadService } from './replay-upload.service';

@Injectable()
export class EndGameUploaderService {
	private readonly supportedModesDeckRetrieve = ['practice', 'friendly', 'ranked', 'casual', 'arena', 'tavernbrawl'];

	constructor(
		private logger: NGXLogger,
		private ow: OverwolfService,
		private gameHelper: GameHelper,
		private replayUploadService: ReplayUploadService,
		private gameParserService: GameParserService,
	) {}

	public async upload(gameEvent: GameEvent, currentGameId: string, deckstring: any): Promise<void> {
		const isManastormRunning = await this.ow.isManastormRunning();
		if (isManastormRunning) {
			// Upload is handled by manastorm
			return;
		}
		const game: GameForUpload = this.initializeGame(gameEvent, currentGameId, deckstring);
		await this.replayUploadService.uploadGame(game);
	}

	private initializeGame(gameEvent: GameEvent, currentGameId: string, deckstring: any): GameForUpload {
		const gameResult = gameEvent.additionalData.game;
		const replayXml = gameEvent.additionalData.replayXml;
		if (!replayXml) {
			this.logger.warn('could not convert replay');
		}
		this.logger.debug('Creating new game', currentGameId);
		const game: GameForUpload = GameForUpload.createEmptyGame(currentGameId);
		game.gameFormat = this.gameParserService.toFormatType(gameResult.FormatType);
		game.gameMode = this.gameParserService.toGameType(gameResult.GameType);
		if (this.supportedModesDeckRetrieve.indexOf(game.gameMode) !== -1) {
			game.deckstring = deckstring;
		}
		this.gameHelper.setXmlReplay(game, replayXml);
		game.uncompressedXmlReplay = replayXml;
		this.gameParserService.extractMatchup(game);
		this.gameParserService.extractDuration(game);
		return game;
	}
}
