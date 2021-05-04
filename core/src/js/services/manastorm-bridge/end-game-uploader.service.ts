import { Injectable } from '@angular/core';
import { parseHsReplayString } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameEvent } from '../../models/game-event';
import { BgsGlobalInfoUpdatedParser } from '../battlegrounds/store/event-parsers/bgs-global-info-updated-parser';
import { DungeonLootParserService } from '../decktracker/dungeon-loot-parser.service';
import { LogsUploaderService } from '../logs-uploader.service';
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
		private logService: LogsUploaderService,
	) {}

	public async upload(
		gameEvent: GameEvent,
		currentReviewId: string,
		deckstring: any,
		deckName: string,
		buildNumber: number,
		scenarioId: number,
		xpGained: number,
	): Promise<void> {
		console.log('[manastorm-bridge]', currentReviewId, 'Uploading game info');
		const game: GameForUpload = await this.initializeGame(
			gameEvent,
			currentReviewId,
			deckstring,
			deckName,
			buildNumber,
			scenarioId,
			xpGained,
		);
		await this.replayUploadService.uploadGame(game);
	}

	private async initializeGame(
		gameEvent: GameEvent,
		currentReviewId: string,
		deckstring: any,
		deckName: string,
		buildNumber: number,
		scenarioId: number,
		xpGained: number,
	): Promise<GameForUpload> {
		const gameResult = gameEvent.additionalData.game;
		const replayXml = gameEvent.additionalData.replayXml;
		if (!replayXml) {
			console.warn('[manastorm-bridge]', currentReviewId, 'could not convert replay');
		}
		console.log('[manastorm-bridge]', currentReviewId, 'Creating new game', 'with replay length', replayXml.length);
		const game: GameForUpload = GameForUpload.createEmptyGame(currentReviewId);
		console.log('[manastorm-bridge]', currentReviewId, 'Created new game');
		game.gameFormat = this.gameParserService.toFormatType(gameResult.FormatType);
		console.log('[manastorm-bridge]', currentReviewId, 'parsed format', gameResult.FormatType, game.gameFormat);
		game.gameMode = this.gameParserService.toGameType(gameResult.GameType);
		console.log('[manastorm-bridge]', currentReviewId, 'parsed type', gameResult.GameType, game.gameMode);

		// Here we want to process the rank info as soon as possible to limit the chances of it
		// being removed from memory by the player clicking away
		let playerRank;
		let newPlayerRank;
		// Get the memory info first, because parsing the XML can take some time and make the
		// info in memory stale / unavailable
		console.log('[manastorm-bridge]', currentReviewId, 'reading memory info');
		const battlegroundsInfo =
			game.gameMode === 'battlegrounds' ? await this.memoryInspection.getBattlegroundsEndGame(5) : null;
		const duelsInfo =
			game.gameMode === 'duels' || game.gameMode === 'paid-duels'
				? await this.memoryInspection.getDuelsInfo()
				: null;
		const arenaInfo = game.gameMode === 'arena' ? await this.memoryInspection.getArenaInfo() : null;
		const playerInfo = await this.playersInfo.getPlayerInfo();
		const opponentInfo = await this.playersInfo.getOpponentInfo();
		console.log('[manastorm-bridge]', currentReviewId, 'read memory info');

		const replay = parseHsReplayString(replayXml);
		if (game.gameMode === 'battlegrounds') {
			// const battlegroundsInfo = await this.memoryInspection.getBattlegroundsEndGame(5);
			playerRank = battlegroundsInfo ? battlegroundsInfo.rating : undefined;
			newPlayerRank = battlegroundsInfo ? battlegroundsInfo.newRating : undefined;
			const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(
				battlegroundsInfo?.game?.AvailableRaces,
			);
			game.availableTribes = availableRaces;
			game.bannedTribes = bannedRaces;
			game.additionalResult = replay.additionalResult;
			console.log('[manastorm-bridge]', currentReviewId, 'updated player rank', playerRank, newPlayerRank);
		} else if (game.gameMode === 'duels' || game.gameMode === 'paid-duels') {
			console.log('[manastorm-bridge]', currentReviewId, 'handline duels', game.gameMode, game);
			// const duelsInfo = await this.memoryInspection.getDuelsInfo();
			if (duelsInfo) {
				console.log('[manastorm-bridge]', currentReviewId, 'got duels info', duelsInfo);
				playerRank = game.gameMode === 'duels' ? duelsInfo.Rating : duelsInfo.PaidRating;
				game.additionalResult = duelsInfo.Wins + '-' + duelsInfo.Losses;
				try {
					if (
						(replay.result === 'won' && duelsInfo.Wins === 11) ||
						(replay.result === 'lost' && duelsInfo.Losses === 2)
					) {
						const newPlayerRank = await this.getDuelsNewPlayerRank(playerRank);
						console.log('[manastorm-bridge]', currentReviewId, 'got duels new player rank', newPlayerRank);
						if (newPlayerRank != null) {
							game.newPlayerRank = '' + newPlayerRank;
						}
					}
				} catch (e) {
					console.error('[manastorm-bridge]', currentReviewId, 'Could not handle rating change in duels', e);
				}
			}
		} else if (game.gameMode === 'arena') {
			// const arenaInfo = await this.memoryInspection.getArenaInfo();
			playerRank = arenaInfo ? arenaInfo.wins + '-' + arenaInfo.losses : undefined;
			console.log('[manastorm-bridge]', currentReviewId, 'updated player rank for arena', playerRank);
		} else if (game.gameFormat !== 'unknown') {
			// const playerInfo = await this.playersInfo.getPlayerInfo();
			if (playerInfo && game.gameFormat === 'standard') {
				if (playerInfo.standard?.legendRank > 0) {
					playerRank = `legend-${playerInfo.standard.legendRank}`;
				} else if (playerInfo.standard.leagueId >= 0 && playerInfo.standard.rankValue >= 0) {
					playerRank = `${playerInfo.standard.leagueId}-${playerInfo.standard.rankValue}`;
				} else {
					console.warn(
						'[manastorm-bridge]',
						currentReviewId,
						'Could not extract standard player rank',
						playerInfo.standard,
					);
					playerRank = null;
				}
			} else if (playerInfo && game.gameFormat === 'wild') {
				if (playerInfo.wild?.legendRank > 0) {
					playerRank = `legend-${playerInfo.wild.legendRank}`;
				} else if (playerInfo.wild.leagueId >= 0 && playerInfo.wild.rankValue >= 0) {
					playerRank = `${playerInfo.wild.leagueId}-${playerInfo.wild.rankValue}`;
				} else {
					console.warn(
						'[manastorm-bridge]',
						currentReviewId,
						'Could not extract wild player rank',
						playerInfo.wild,
					);
					playerRank = null;
				}
			} else if (playerInfo && game.gameFormat === 'classic') {
				if (playerInfo.classic?.legendRank > 0) {
					playerRank = `legend-${playerInfo.classic.legendRank}`;
				} else if (playerInfo.classic.leagueId >= 0 && playerInfo.classic.rankValue >= 0) {
					playerRank = `${playerInfo.classic.leagueId}-${playerInfo.classic.rankValue}`;
				} else {
					console.warn(
						'[manastorm-bridge]',
						currentReviewId,
						'Could not extract classic player rank',
						playerInfo.classic,
					);
					playerRank = null;
				}
			}
		}
		let opponentRank;
		if (game.gameMode === 'battlegrounds' || game.gameMode === 'duels' || game.gameMode === 'paid-duels') {
			// Do nothing
		} else if (game.gameFormat === 'standard' || game.gameFormat === 'wild') {
			// const opponentInfo = await this.playersInfo.getOpponentInfo();
			if (opponentInfo && game.gameFormat === 'standard') {
				if (opponentInfo.standard?.legendRank > 0) {
					opponentRank = `legend-${opponentInfo.standard.legendRank}`;
				} else if (opponentInfo.standard.leagueId >= 0 && opponentInfo.standard.rankValue >= 0) {
					opponentRank = `${opponentInfo.standard.leagueId}-${opponentInfo.standard?.rankValue}`;
				} else {
					console.warn(
						'[manastorm-bridge]',
						currentReviewId,
						'Could not extract opponent rank',
						opponentInfo.standard,
					);
					opponentRank = null;
				}
			} else if (opponentInfo && game.gameFormat === 'wild') {
				if (opponentInfo.wild?.legendRank > 0) {
					opponentRank = `legend-${opponentInfo.wild.legendRank}`;
				} else if (opponentInfo.wild.leagueId >= 0 && opponentInfo.wild.rankValue >= 0) {
					opponentRank = `${opponentInfo.wild.leagueId}-${opponentInfo.wild?.rankValue}`;
				} else {
					console.warn(
						'[manastorm-bridge]',
						currentReviewId,
						'Could not extract opponent rank',
						opponentInfo.wild,
					);
					opponentRank = null;
				}
			}
		}
		game.opponentRank = opponentRank;
		game.playerRank = playerRank;
		game.newPlayerRank = newPlayerRank;
		console.log('[manastorm-bridge]', currentReviewId, 'extracted player rank');

		game.reviewId = currentReviewId;
		game.buildNumber = buildNumber;
		game.scenarioId = scenarioId;
		game.xpGained = xpGained;
		if (this.supportedModesDeckRetrieve.indexOf(game.gameMode) !== -1) {
			console.log('[manastorm-bridge]', currentReviewId, 'adding deckstring', deckstring, game.gameMode);
			game.deckstring = deckstring;
			game.deckName = deckName;
		} else {
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'game mode not supporting deckstrings, not sending it',
				deckstring,
				game.gameMode,
			);
		}
		console.log('[manastorm-bridge]', currentReviewId, 'added meta data');
		game.uncompressedXmlReplay = replayXml;
		console.log('[manastorm-bridge]', currentReviewId, 'set xml replay');
		this.gameParserService.extractMatchup(replay, game);
		console.log('[manastorm-bridge]', currentReviewId, 'extracted matchup');
		this.gameParserService.extractDuration(replay, game);
		console.log('[manastorm-bridge]', currentReviewId, 'extracted duration');

		game.currentDuelsRunId = this.dungeonLootParser.currentDuelsRunId;
		if (game.gameMode === 'duels' || game.gameMode === 'paid-duels') {
			console.log('[manastorm-bridge]', currentReviewId, 'added duels run id', game.currentDuelsRunId);
			if (!game.currentDuelsRunId) {
				console.log(
					'[manastorm-bridge]',
					currentReviewId,
					'currentDuelsRunId is missing, waiting for dungeon loot info to be retrieved',
				);
				while (this.dungeonLootParser.busyRetrievingInfo) {
					await sleep(200);
				}
				game.currentDuelsRunId = this.dungeonLootParser.currentDuelsRunId;
				console.log(
					'[manastorm-bridge]',
					currentReviewId,
					'dungeon loot info retrieved, continuing',
					game.currentDuelsRunId,
				);
			}
			if (!game.currentDuelsRunId) {
				console.warn(
					'[manastorm-bridge]',
					currentReviewId,
					'currentDuelsRunId is missing',
					game.currentDuelsRunId,
					game.gameMode,
					this.dungeonLootParser.currentDuelsRunId,
				);
				game.currentDuelsRunId = this.dungeonLootParser.currentDuelsRunId;
				// So that we have time to collect more logs, especially the ones linked to replay upload
				setTimeout(() => this.logService.reportSpecificBug('duels-empty-run-id'), 5000);
			}
			// this.dungeonLootParser.resetDuelsRunId();
		}

		console.log('[manastorm-bridge]', currentReviewId, 'game ready');
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
