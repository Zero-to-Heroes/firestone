import { Injectable } from '@angular/core';
import { parseHsReplayString } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { Race } from '@firestone-hs/reference-data';
import { ArenaInfo } from '../../models/arena-info';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { toFormatType } from '../../models/mainwindow/stats/stat-game-format.type';
import { toGameType } from '../../models/mainwindow/stats/stat-game-mode.type';
import { MatchInfo } from '../../models/match-info';
import { DuelsInfo } from '../../models/memory/memory-duels';
import { MemoryMercenariesCollectionInfo, MemoryTeam } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { BattlegroundsStoreService } from '../battlegrounds/store/battlegrounds-store.service';
import { BgsGlobalInfoUpdatedParser } from '../battlegrounds/store/event-parsers/bgs-global-info-updated-parser';
import { CardsFacadeService } from '../cards-facade.service';
import { ArenaRunParserService } from '../decktracker/arena-run-parser.service';
import { DeckInfo } from '../decktracker/deck-parser.service';
import { DuelsLootParserService } from '../duels/duels-loot-parser.service';
import { isDuels } from '../duels/duels-utils';
import { HsGameMetaData } from '../game-mode-data.service';
import { LogsUploaderService } from '../logs-uploader.service';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { MercenariesReferenceData } from '../mercenaries/mercenaries-state-builder.service';
import {
	isMercenaries,
	isMercenariesPvE,
	isMercenariesPvP,
	normalizeMercenariesCardId,
} from '../mercenaries/mercenaries-utils';
import { XpForGameInfo } from '../rewards/rewards-monitor';
import { extractHeroTimings } from '../stats/game/game-stats-updater.service';
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
		'tavern-brawl',
		'duels',
		'paid-duels',
	];

	constructor(
		private replayUploadService: ReplayUploadService,
		private gameParserService: GameParserService,
		private dungeonLootParser: DuelsLootParserService,
		private arenaService: ArenaRunParserService,
		private logService: LogsUploaderService,
		private mainWindowStore: MainWindowStoreService,
		private readonly bgsStore: BattlegroundsStoreService,
		private readonly allCards: CardsFacadeService,
	) {}

	public async upload2(info: UploadInfo): Promise<void> {
		console.log('[manastorm-bridge]', info.reviewId, 'Uploading game info');
		const game: GameForUpload = this.initializeGame(info);
		await this.replayUploadService.uploadGame(game);
	}

	private initializeGame(info: UploadInfo): GameForUpload {
		const currentReviewId = info.reviewId;
		const gameResult = info.gameEnded.game;
		const replayXml = info.gameEnded.replayXml;

		if (!replayXml) {
			console.warn('[manastorm-bridge]', currentReviewId, 'could not convert replay');
		}
		console.log('[manastorm-bridge]', currentReviewId, 'Creating new game', 'with replay length', replayXml.length);
		const game: GameForUpload = GameForUpload.createEmptyGame(currentReviewId);
		console.log('[manastorm-bridge]', currentReviewId, 'Created new game');
		game.gameFormat = toFormatType(gameResult.FormatType);
		console.log('[manastorm-bridge]', currentReviewId, 'parsed format', gameResult.FormatType, game.gameFormat);
		game.gameMode = toGameType(gameResult.GameType);
		console.log('[manastorm-bridge]', currentReviewId, 'parsed type', gameResult.GameType, game.gameMode);

		// Here we want to process the rank info as soon as possible to limit the chances of it
		// being removed from memory by the player clicking away
		let playerRank;
		let newPlayerRank;

		const playerInfo = info.matchInfo?.localPlayer;
		const opponentInfo = info.matchInfo?.opponent;

		const replay = parseHsReplayString(replayXml, this.allCards.getService());
		if (isBattlegrounds(game.gameMode)) {
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'memory battlegroundsInfo',
				info.bgInfo?.Rating,
				info.bgInfo?.NewRating,
			);
			playerRank = info.bgInfo?.Rating;
			// Some issues with bgsNewRating + spectate?
			newPlayerRank = info.battlegroundsInfoAfterGameOver?.NewRating;
			let [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(
				info.bgInfo?.Game?.AvailableRaces,
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
			game.hasBgsPrizes = info.gameSettings?.battlegroundsPrizes;
		} else if (isMercenaries(game.gameMode)) {
			// Looks like we can assume the mapId is unique for a given player
			game.runId = isMercenariesPvE(game.gameMode)
				? info.mercsInfo?.Map?.PlayerTeamName +
				  '-' +
				  info.mercsInfo?.Map?.MapId +
				  '-' +
				  info.mercsInfo?.Map?.Seed
				: null;
			game.mercsBountyId = isMercenariesPvE(game.gameMode) ? info.mercsInfo?.Map?.BountyId : null;

			const referenceData = this.mainWindowStore?.state?.mercenaries?.referenceData;
			const { mercHeroTimings, ...other } = extractHeroTimings(
				{ gameMode: game.gameMode },
				replay,
				referenceData,
				this.allCards.getService(),
			);
			// console.debug('mercs stats in uploader', mercHeroTimings, other);

			// These don't work in PvP
			if (!!mercHeroTimings?.length) {
				if (isMercenariesPvE(game.gameMode)) {
					game.deckName = info.mercsInfo?.Map?.PlayerTeamName;
					game.deckstring = [...(info.mercsInfo?.Map?.PlayerTeamMercIds ?? [])].sort().join(',');
				} else if (isMercenariesPvP(game.gameMode)) {
					const allPlayerHeroes = mercHeroTimings
						.map((timing) => timing.cardId)
						.map((c) => normalizeMercenariesCardId(c))
						.sort();
					const team: MemoryTeam = this.findMercTeam(
						info.mercsCollectionInfo?.Teams,
						allPlayerHeroes,
						referenceData,
					);
					game.deckName = team?.Name;
					game.deckstring = [...(team?.Mercenaries?.map((merc) => merc.Id) ?? [])].sort().join(',');
				}
			}
			playerRank =
				game.gameMode === 'mercenaries-pvp'
					? info.mercsInfo?.PvpRating
					: game.gameMode === 'mercenaries-pve' || game.gameMode === 'mercenaries-pve-coop'
					? this.getMercenariesBountyDifficulty(game.mercsBountyId)
					: null;
			game.forceOpponentName =
				game.gameMode === 'mercenaries-pve' || game.gameMode === 'mercenaries-pve-coop'
					? this.buildOpponentName(info.mercsInfo)
					: null;
		} else if (game.gameMode === 'duels' || game.gameMode === 'paid-duels') {
			console.log('[manastorm-bridge]', currentReviewId, 'handline duels', game.gameMode);
			console.log('[manastorm-bridge]', currentReviewId, 'got duels info', info.duelsInfo);
			playerRank = game.gameMode === 'duels' ? info.duelsInfo?.Rating : info.duelsInfo?.PaidRating;
			const wins = info.duelsInfo?.Wins;
			const losses = info.duelsInfo?.Losses;
			if (wins != null && losses != null) {
				game.additionalResult = wins + '-' + losses;
				console.log('[manastorm-bridge]', currentReviewId, 'duels result', game.additionalResult);
			}
			try {
				if ((replay.result === 'won' && wins === 11) || (replay.result === 'lost' && losses === 2)) {
					console.log('[manastorm-bridge]', currentReviewId, 'got duels new player rank', newPlayerRank);
					if (info.duelsPlayerRankAfterGameOver != null) {
						game.newPlayerRank = '' + info.duelsPlayerRankAfterGameOver;
					}
				}
			} catch (e) {
				console.error('[manastorm-bridge]', currentReviewId, 'Could not handle rating change in duels', e);
			}
			// }
		} else if (game.gameMode === 'arena') {
			// TODO: move away from player rank for arena to match what is done in duels
			playerRank = info.arenaInfo ? info.arenaInfo.wins + '-' + info.arenaInfo.losses : undefined;
			game.additionalResult = info.arenaInfo ? info.arenaInfo.wins + '-' + info.arenaInfo.losses : undefined;
			console.log('[manastorm-bridge]', currentReviewId, 'updated player rank for arena', playerRank);
		} else if (game.gameFormat !== 'unknown') {
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
		if (isBattlegrounds(game.gameMode) || isDuels(game.gameMode) || isMercenaries(game.gameMode)) {
			// Do nothing
		} else if (game.gameFormat === 'standard' || game.gameFormat === 'wild') {
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
		game.buildNumber = info.metadata.BuildNumber;
		// So that we can have overwrites, eg for LETTUCE_PVP_VS_AI
		game.scenarioId = gameResult.ScenarioID; // scenarioId;
		game.xpForGame = info.xpForGame;
		if (this.supportedModesDeckRetrieve.indexOf(game.gameMode) !== -1) {
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'adding deckstring',
				info.playerDeck?.deckstring,
				game.gameMode,
				info.playerDeck?.name,
			);
			game.deckstring = info.playerDeck?.deckstring;
			game.deckName = info.playerDeck?.name;
		} else {
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'game mode not supporting deckstrings, not sending it',
				info.playerDeck?.deckstring,
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

		if (isDuels(game.gameMode)) {
			game.runId = info.duelsRunId;
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

export interface UploadInfo {
	reviewId: string;
	metadata: HsGameMetaData;
	gameEnded: {
		ended: boolean;
		spectating: boolean;
		game: any;
		replayXml: string;
	};
	matchInfo: MatchInfo;
	playerDeck: DeckInfo;
	duelsInfo: DuelsInfo;
	arenaInfo: ArenaInfo;
	mercsInfo: MemoryMercenariesInfo;
	mercsCollectionInfo: MemoryMercenariesCollectionInfo;
	bgInfo: BattlegroundsInfo;
	gameSettings: {
		battlegroundsPrizes: boolean;
		battlegroundsQuests: boolean;
	};
	duelsRunId: string;
	battlegroundsInfoAfterGameOver?: BattlegroundsInfo;
	duelsPlayerRankAfterGameOver?: number;
	xpForGame?: XpForGameInfo;
}
