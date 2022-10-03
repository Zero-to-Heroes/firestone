import { Injectable } from '@angular/core';
import { parseHsReplayString } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { Race } from '@firestone-hs/reference-data';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { GameEvent } from '../../models/game-event';
import { MemoryMercenariesCollectionInfo, MemoryTeam } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { BattlegroundsStoreService } from '../battlegrounds/store/battlegrounds-store.service';
import { BgsGlobalInfoUpdatedParser } from '../battlegrounds/store/event-parsers/bgs-global-info-updated-parser';
import { CardsFacadeService } from '../cards-facade.service';
import { ArenaRunParserService } from '../decktracker/arena-run-parser.service';
import { DungeonLootParserService } from '../decktracker/dungeon-loot-parser.service';
import { LogsUploaderService } from '../logs-uploader.service';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { MercenariesReferenceData } from '../mercenaries/mercenaries-state-builder.service';
import {
	isMercenaries,
	isMercenariesPvE,
	isMercenariesPvP,
	normalizeMercenariesCardId,
} from '../mercenaries/mercenaries-utils';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { RewardMonitorService } from '../rewards/rewards-monitor';
import { extractHeroTimings } from '../stats/game/game-stats-updater.service';
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
		private memoryInspection: MemoryInspectionService,
		private dungeonLootParser: DungeonLootParserService,
		private arenaService: ArenaRunParserService,
		private logService: LogsUploaderService,
		private rewards: RewardMonitorService,
		private mainWindowStore: MainWindowStoreService,
		private readonly bgsStore: BattlegroundsStoreService,
		private readonly allCards: CardsFacadeService,
	) {}

	public async upload(
		gameEvent: GameEvent,
		currentReviewId: string,
		deckstring: any,
		deckName: string,
		buildNumber: number,
		scenarioId: number,
		params?: UploadParams,
	): Promise<void> {
		console.log('[manastorm-bridge]', currentReviewId, 'Uploading game info');
		const game: GameForUpload = await this.initializeGame(
			gameEvent,
			currentReviewId,
			deckstring,
			deckName,
			buildNumber,
			params,
		);
		await this.replayUploadService.uploadGame(game);
	}

	private async initializeGame(
		gameEvent: GameEvent,
		currentReviewId: string,
		deckstring: any,
		deckName: string,
		buildNumber: number,
		params?: UploadParams,
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
		const [
			battlegroundsInfo,
			mercenariesCollectionInfo,
			mercenariesInfo,
			duelsInfo,
			arenaInfo,
			matchInfo,
			xpForGame,
		] = await Promise.all([
			game.gameMode === 'battlegrounds' || game.gameMode === 'battlegrounds-friendly'
				? this.getBattlegroundsEndGame(currentReviewId)
				: null,
			isMercenaries(game.gameMode) ? this.getMercenariesCollectionInfo(currentReviewId) : null,
			isMercenaries(game.gameMode) ? this.getMercenariesInfo(currentReviewId) : null,
			game.gameMode === 'duels' || game.gameMode === 'paid-duels' ? this.memoryInspection.getDuelsInfo() : null,
			game.gameMode === 'arena' ? this.memoryInspection.getArenaInfo() : null,
			isMercenaries(game.gameMode) ||
			game.gameMode === 'battlegrounds' ||
			game.gameMode === 'battlegrounds-friendly'
				? null
				: this.memoryInspection.getMatchInfo(),
			this.rewards.getXpForGameInfo(),
		]);
		console.log('[manastorm-bridge]', currentReviewId, 'read memory info');

		const playerInfo = matchInfo?.localPlayer;
		const opponentInfo = matchInfo?.opponent;

		const replay = parseHsReplayString(replayXml, this.allCards.getService());
		if (game.gameMode === 'battlegrounds' || game.gameMode === 'battlegrounds-friendly') {
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'memory battlegroundsInfo',
				battlegroundsInfo?.Rating,
				battlegroundsInfo?.NewRating,
				battlegroundsInfo,
			);
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'mmr info',
				this.bgsStore?.state?.currentGame?.mmrAtStart,
				params.bgsInfo?.currentRating,
				params.bgsInfo?.newRating,
			);
			// Rely on the MMR at start instead of the memory info, as if the info comes too late
			// (there are sometimes quite big lags after a game, for some reason) it will already
			// have the new rating
			playerRank =
				params.bgsInfo?.currentRating ??
				this.bgsStore?.state?.currentGame?.mmrAtStart ??
				battlegroundsInfo?.Rating;
			// Some issues with bgsNewRating + spectate?
			newPlayerRank = battlegroundsInfo?.NewRating ?? params.bgsInfo?.newRating;
			let [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(
				battlegroundsInfo?.Game?.AvailableRaces,
			);
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'available races',
				availableRaces,
				availableRaces?.map((r) => Race[r] ?? r),
				this.bgsStore?.state?.currentGame?.availableRaces?.map((r) => Race[r] ?? r),
			);
			availableRaces = availableRaces ?? this.bgsStore?.state?.currentGame?.availableRaces;
			bannedRaces = bannedRaces ?? this.bgsStore?.state?.currentGame?.bannedRaces;
			game.availableTribes = availableRaces;
			game.bannedTribes = bannedRaces;
			game.additionalResult = replay.additionalResult;
			console.log('[manastorm-bridge]', currentReviewId, 'updated player rank', playerRank, newPlayerRank);
			game.hasBgsPrizes = params.bgsInfo.hasPrizes;
		} else if (isMercenaries(game.gameMode)) {
			// Looks like we can assume the mapId is unique for a given player
			game.runId = isMercenariesPvE(game.gameMode)
				? mercenariesInfo?.Map?.PlayerTeamName +
				  '-' +
				  mercenariesInfo?.Map?.MapId +
				  '-' +
				  mercenariesInfo?.Map?.Seed
				: null;
			game.mercsBountyId = isMercenariesPvE(game.gameMode) ? mercenariesInfo?.Map?.BountyId : null;

			const referenceData = await this.mainWindowStore?.state?.mercenaries?.referenceData;
			const { mercHeroTimings, ...other } = await extractHeroTimings(
				{ gameMode: game.gameMode },
				replay,
				referenceData,
				this.allCards.getService(),
			);
			// console.debug('mercs stats in uploader', mercHeroTimings, other);

			// These don't work in PvP
			if (!!mercHeroTimings?.length) {
				if (isMercenariesPvE(game.gameMode)) {
					game.deckName = mercenariesInfo?.Map?.PlayerTeamName;
					game.deckstring = [...(mercenariesInfo?.Map?.PlayerTeamMercIds ?? [])].sort().join(',');
				} else if (isMercenariesPvP(game.gameMode)) {
					const allPlayerHeroes = mercHeroTimings
						.map((timing) => timing.cardId)
						.map((c) => normalizeMercenariesCardId(c))
						.sort();
					const team: MemoryTeam = this.findMercTeam(
						mercenariesCollectionInfo?.Teams,
						allPlayerHeroes,
						referenceData,
					);
					game.deckName = team?.Name;
					game.deckstring = [...(team?.Mercenaries?.map((merc) => merc.Id) ?? [])].sort().join(',');
				}
			}
			playerRank =
				game.gameMode === 'mercenaries-pvp'
					? mercenariesInfo?.PvpRating
					: game.gameMode === 'mercenaries-pve' || game.gameMode === 'mercenaries-pve-coop'
					? this.getMercenariesBountyDifficulty(game.mercsBountyId)
					: null;
			game.forceOpponentName =
				game.gameMode === 'mercenaries-pve' || game.gameMode === 'mercenaries-pve-coop'
					? this.buildOpponentName(mercenariesInfo)
					: null;
		} else if (game.gameMode === 'duels' || game.gameMode === 'paid-duels') {
			console.log('[manastorm-bridge]', currentReviewId, 'handline duels', game.gameMode);
			// const duelsInfo = await this.memoryInspection.getDuelsInfo();
			// if (duelsInfo) {
			console.log('[manastorm-bridge]', currentReviewId, 'got duels info', duelsInfo, params.duelsInfo);
			playerRank =
				game.gameMode === 'duels'
					? params.duelsInfo?.rating ?? duelsInfo?.Rating
					: params.duelsInfo?.paidRating ?? duelsInfo?.PaidRating;
			// Not sure which one is the most reliable. I'm putting the one we just got from the memory as I suspect the information
			// is more up-to-date, but maybe that could be wrong if there is some lag and the user has already started a new game
			// UPDATE: the other way around is used everywhere else, so sticking with it, as it hasn't
			// revealed any major bug
			// UPDATE2: there are some issues where the game data that is sent already contains the info for the next game
			// which leads to duplicate entries in terms of win/loss (eg at 3-1, lost, the data is only retrieved after it has
			// been update to 3-2, and so we send twice the info with 3-2)
			const wins = params.duelsInfo?.wins ?? duelsInfo?.Wins;
			const losses = params.duelsInfo?.losses ?? duelsInfo?.Losses;
			if (wins != null && losses != null) {
				game.additionalResult = wins + '-' + losses;
				console.log('[manastorm-bridge]', currentReviewId, 'duels result', game.additionalResult);
			}
			try {
				if ((replay.result === 'won' && wins === 11) || (replay.result === 'lost' && losses === 2)) {
					const newPlayerRank = await this.getDuelsNewPlayerRank(playerRank);
					console.log('[manastorm-bridge]', currentReviewId, 'got duels new player rank', newPlayerRank);
					if (newPlayerRank != null) {
						game.newPlayerRank = '' + newPlayerRank;
					}
				}
			} catch (e) {
				console.error('[manastorm-bridge]', currentReviewId, 'Could not handle rating change in duels', e);
			}
			// }
		} else if (game.gameMode === 'arena') {
			// const arenaInfo = await this.memoryInspection.getArenaInfo();
			// TODO: move away from player rank for arena to match what is done in duels
			playerRank = arenaInfo ? arenaInfo.wins + '-' + arenaInfo.losses : undefined;
			game.additionalResult = arenaInfo ? arenaInfo.wins + '-' + arenaInfo.losses : undefined;
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
		if (
			game.gameMode === 'battlegrounds' ||
			game.gameMode === 'battlegrounds-friendly' ||
			game.gameMode === 'duels' ||
			game.gameMode === 'paid-duels'
		) {
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
		// So that we can have overwrites, eg for LETTUCE_PVP_VS_AI
		game.scenarioId = gameResult.ScenarioID; // scenarioId;
		game.xpForGame = xpForGame;
		if (this.supportedModesDeckRetrieve.indexOf(game.gameMode) !== -1) {
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'adding deckstring',
				deckstring,
				game.gameMode,
				deckName,
			);
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

		if (game.gameMode === 'duels' || game.gameMode === 'paid-duels') {
			game.runId = this.dungeonLootParser.currentDuelsRunId;
			console.log('[manastorm-bridge]', currentReviewId, 'added duels run id', game.runId);
			if (!game.runId) {
				console.log(
					'[manastorm-bridge]',
					currentReviewId,
					'currentDuelsRunId is missing, waiting for dungeon loot info to be retrieved',
				);
				while (this.dungeonLootParser.busyRetrievingInfo) {
					await sleep(200);
				}
				game.runId = this.dungeonLootParser.currentDuelsRunId;
				console.log(
					'[manastorm-bridge]',
					currentReviewId,
					'dungeon loot info retrieved, continuing',
					game.runId,
				);
			}
			if (!game.runId) {
				console.warn(
					'[manastorm-bridge]',
					currentReviewId,
					'currentDuelsRunId is missing',
					game.runId,
					game.gameMode,
					this.dungeonLootParser.currentDuelsRunId,
				);
				game.runId = this.dungeonLootParser.currentDuelsRunId;
				// So that we have time to collect more logs, especially the ones linked to replay upload
				setTimeout(() => this.logService.reportSpecificBug('duels-empty-run-id'), 5000);
			}
			// this.dungeonLootParser.resetDuelsRunId();
		} else if (game.gameMode === 'arena') {
			game.runId = this.arenaService.currentArenaRunId;
		}

		console.log('[manastorm-bridge]', currentReviewId, 'game ready');
		console.debug('[manastorm-bridge]', currentReviewId, 'game ready', game);
		return game;
	}

	private findMercTeam(
		Teams: readonly MemoryTeam[],
		allPlayerHeroes: string[],
		referenceData: MercenariesReferenceData,
	): MemoryTeam {
		if (!Teams?.length) {
			return null;
		}

		for (const team of Teams) {
			const mercIds = team.Mercenaries.map((merc) => merc.Id);
			const mercCardIds = mercIds
				.map((mercId) => referenceData.mercenaries.find((m) => m.id === mercId))
				.filter((m) => !!m)
				.map((m) => this.allCards.getCardFromDbfId(m.cardDbfId))
				.map((card) => normalizeMercenariesCardId(card.id))
				.sort();
			if (allPlayerHeroes.join(',') === mercCardIds.join(',')) {
				return team;
			}
		}

		return null;
	}

	private buildOpponentName(mercenariesInfo: MemoryMercenariesInfo): string {
		const bountyId = mercenariesInfo?.Map?.BountyId;
		if (bountyId == null) {
			return null;
		}

		const referenceData = this.mainWindowStore?.state?.mercenaries?.getReferenceData();
		console.debug('referenceData ', referenceData, bountyId);
		if (!referenceData) {
			return null;
		}

		const allBounties = referenceData.bountySets.map((set) => set.bounties).reduce((a, b) => a.concat(b), []);
		console.debug('allBounties', allBounties);
		const bounty = allBounties.find((b) => b.id === bountyId);
		if (!bounty) {
			return `${bountyId}`;
		}

		return `${bounty.name} (${mercenariesInfo.Map.CurrentStep} / ${mercenariesInfo.Map.MaxStep})`;
	}

	private getMercenariesBountyDifficulty(mercsBountyId: number): 'normal' | 'heroic' | 'legendary' {
		const referenceData = this.mainWindowStore?.state?.mercenaries?.getReferenceData();
		console.debug('referenceData', referenceData, mercsBountyId);
		if (!referenceData) {
			return null;
		}
		const allBounties = referenceData.bountySets.map((set) => set.bounties).reduce((a, b) => a.concat(b), []);
		console.debug('allBounties', allBounties);
		const bounty = allBounties.find((b) => b.id === mercsBountyId);
		console.debug('bounty', bounty);
		if (!bounty) {
			return null;
		}
		return bounty.heroic === 1 ? 'heroic' : 'normal';
	}

	private async getBattlegroundsEndGame(currentReviewId: string): Promise<BattlegroundsInfo> {
		const result = await this.memoryInspection.getBattlegroundsEndGame();
		console.log('[manastorm-bridge]', currentReviewId, 'received BG rank result', result);
		return result;
	}

	private async getMercenariesCollectionInfo(currentReviewId: string): Promise<MemoryMercenariesCollectionInfo> {
		const result = await this.memoryInspection.getMercenariesCollectionInfo();
		console.log('[manastorm-bridge]', currentReviewId, 'getMercenariesCollectionInfo', result);
		return result;
	}

	private async getMercenariesInfo(currentReviewId: string): Promise<MemoryMercenariesInfo> {
		const result = await this.memoryInspection.getMercenariesInfo();
		console.log('[manastorm-bridge]', currentReviewId, 'getMercenariesInfo', result);
		return result;
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

export interface UploadParams {
	bgsInfo: {
		hasPrizes: boolean;
		newRating: number;
		currentRating: number;
	};
	duelsInfo: {
		wins: number;
		losses: number;
		rating: number;
		paidRating: number;
	};
}
