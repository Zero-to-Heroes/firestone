import { Injectable } from '@angular/core';
import { parseHsReplayString } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameEvent } from '../../models/game-event';
import { BgsGlobalInfoUpdatedParser } from '../battlegrounds/store/event-parsers/bgs-global-info-updated-parser';
import { DungeonLootParserService } from '../decktracker/dungeon-loot-parser.service';
import { PlayersInfoService } from '../players-info.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { sleep } from '../utils';
import { GameForUpload } from './game-for-upload';
import { GameParserService } from './game-parser.service';
import { ReplayUploadService } from './replay-upload.service';

@Injectable()
export class EndGameUploaderService {
	private readonly supportedModesDeckRetrieve = [
		'practice',
		'friendly',
		'ranked',
		'casual',
		'arena',
		'tavernbrawl',
		'duels',
		'paid-duels',
	];

	constructor(
		private replayUploadService: ReplayUploadService,
		private gameParserService: GameParserService,
		private playersInfo: PlayersInfoService,
		private memoryInspection: MemoryInspectionService,
		private dungeonLootParser: DungeonLootParserService,
	) {}

	public async upload(
		gameEvent: GameEvent,
		currentReviewId: string,
		currentGameId: string,
		deckstring: any,
		deckName: string,
		buildNumber: number,
		scenarioId: number,
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
		scenarioId: number,
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
		console.log('[manastorm-bridge] parsed format', gameResult.FormatType, game.gameFormat);
		game.gameMode = this.gameParserService.toGameType(gameResult.GameType);
		console.log('[manastorm-bridge] parsed type', gameResult.GameType, game.gameMode);
		game.currentDuelsRunId = this.dungeonLootParser.currentDuelsRunId;

		// Here we want to process the rank info as soon as possible to limit the chances of it
		// being removed from memory by the player clicking away
		let playerRank;
		let newPlayerRank;
		if (game.gameMode === 'battlegrounds') {
			const battlegroundsInfo = await this.memoryInspection.getBattlegroundsEndGame(5);
			playerRank = battlegroundsInfo ? battlegroundsInfo.rating : undefined;
			newPlayerRank = battlegroundsInfo ? battlegroundsInfo.newRating : undefined;
			const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(
				battlegroundsInfo?.game?.AvailableRaces,
			);
			game.availableTribes = availableRaces;
			game.bannedTribes = bannedRaces;
			console.log('updated player rank', playerRank, newPlayerRank);
		} else if (game.gameMode === 'duels' || game.gameMode === 'paid-duels') {
			console.log('handline duels', game.gameMode, game);
			const duelsInfo = await this.memoryInspection.getDuelsInfo();
			console.log('got duels info', duelsInfo);
			playerRank = game.gameMode === 'duels' ? duelsInfo.Rating : duelsInfo.PaidRating;
			game.additionalResult = duelsInfo.Wins + '-' + duelsInfo.Losses;
			try {
				const replay = parseHsReplayString(replayXml);
				if (
					(replay.result === 'won' && duelsInfo.Wins === 11) ||
					(replay.result === 'lost' && duelsInfo.Losses === 2)
				) {
					const newPlayerRank = await this.getDuelsNewPlayerRank(playerRank);
					if (newPlayerRank != null) {
						game.newPlayerRank = '' + newPlayerRank;
					}
					this.dungeonLootParser.resetDuelsRunId();
				}
			} catch (e) {
				console.error('Could not handle rating change in duels', e);
			}
		} else if (game.gameMode === 'arena') {
			const arenaInfo = await this.memoryInspection.getArenaInfo();
			playerRank = arenaInfo ? arenaInfo.wins + '-' + arenaInfo.losses : undefined;
			console.log('updated player rank for arena', playerRank);
		} else if (game.gameFormat === 'standard' || game.gameFormat === 'wild') {
			const playerInfo = await this.playersInfo.getPlayerInfo();
			if (playerInfo && game.gameFormat === 'standard') {
				if (playerInfo.standard?.legendRank > 0) {
					playerRank = `legend-${playerInfo.standard.legendRank}`;
				} else if (playerInfo.standard.leagueId >= 0 && playerInfo.standard.rankValue >= 0) {
					playerRank = `${playerInfo.standard.leagueId}-${playerInfo.standard.rankValue}`;
				} else {
					console.warn('Could not extract player rank', playerInfo.standard);
					playerRank = null;
				}
			} else if (playerInfo && game.gameFormat === 'wild') {
				if (playerInfo.wild?.legendRank > 0) {
					playerRank = `legend-${playerInfo.wild.legendRank}`;
				} else if (playerInfo.wild.leagueId >= 0 && playerInfo.wild.rankValue >= 0) {
					playerRank = `${playerInfo.wild.leagueId}-${playerInfo.wild.rankValue}`;
				} else {
					console.warn('Could not extract player rank', playerInfo.wild);
					playerRank = null;
				}
			}
		}
		let opponentRank;
		if (game.gameMode === 'battlegrounds' || game.gameMode === 'duels' || game.gameMode === 'paid-duels') {
			// Do nothing
		} else if (game.gameFormat === 'standard' || game.gameFormat === 'wild') {
			const opponentInfo = await this.playersInfo.getOpponentInfo();
			if (opponentInfo && game.gameFormat === 'standard') {
				if (opponentInfo.standard?.legendRank > 0) {
					opponentRank = `legend-${opponentInfo.standard.legendRank}`;
				} else if (opponentInfo.standard.leagueId >= 0 && opponentInfo.standard.rankValue >= 0) {
					opponentRank = `${opponentInfo.standard.leagueId}-${opponentInfo.standard?.rankValue}`;
				} else {
					console.warn('Could not extract opponent rank', opponentInfo.standard);
					opponentRank = null;
				}
			} else if (opponentInfo && game.gameFormat === 'wild') {
				if (opponentInfo.wild?.legendRank > 0) {
					opponentRank = `legend-${opponentInfo.wild.legendRank}`;
				} else if (opponentInfo.wild.leagueId >= 0 && opponentInfo.wild.rankValue >= 0) {
					opponentRank = `${opponentInfo.wild.leagueId}-${opponentInfo.wild?.rankValue}`;
				} else {
					console.warn('Could not extract opponent rank', opponentInfo.wild);
					opponentRank = null;
				}
			}
		}
		game.opponentRank = opponentRank;
		game.playerRank = playerRank;
		game.newPlayerRank = newPlayerRank;
		console.log('[manastorm-bridge] extracted player rank');

		game.reviewId = currentReviewId;
		game.buildNumber = buildNumber;
		game.scenarioId = scenarioId;
		if (this.supportedModesDeckRetrieve.indexOf(game.gameMode) !== -1) {
			console.log('[manastorm-bridge] adding deckstring', deckstring, game.gameMode);
			game.deckstring = deckstring;
			game.deckName = deckName;
		} else {
			console.log(
				'[manastorm-bridge] game mode not supporting deckstrings, not sending it',
				deckstring,
				game.gameMode,
			);
		}
		console.log('[manastorm-bridge] added meta data');
		game.uncompressedXmlReplay = replayXml;
		console.log('[manastorm-bridge] set xml replay');
		this.gameParserService.extractMatchup(game);
		console.log('[manastorm-bridge] extracted matchup');
		this.gameParserService.extractDuration(game);
		console.log('[manastorm-bridge] extracted duration');

		console.log('[manastorm-bridge] game ready');
		return game;
	}

	private async getDuelsNewPlayerRank(initialRank: number): Promise<number> {
		let duelsInfo = await this.memoryInspection.getDuelsInfo();
		let retriesLeft = 10;
		while (!duelsInfo?.LastRatingChange && retriesLeft >= 0) {
			await sleep(2000);
			duelsInfo = await this.memoryInspection.getDuelsInfo();
			retriesLeft--;
		}
		if (!duelsInfo) {
			return null;
		}
		return duelsInfo.LastRatingChange + initialRank;
	}
}
