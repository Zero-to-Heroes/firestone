import { Injectable } from '@angular/core';
import { extractTotalTurns, parseHsReplayString } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { TOTAL_RACES_IN_GAME } from '@firestone-hs/reference-data';
import { ReplayUploadMetadata } from '@firestone-hs/replay-metadata';
import { BgsGame } from '@firestone/game-state';
import {
	ArenaInfo,
	BattlegroundsInfo,
	MatchInfo,
	MemoryMercenariesCollectionInfo,
	MemoryMercenariesInfo,
	MemoryTeam,
} from '@firestone/memory';
import { LogsUploaderService, PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameForUpload, XpForGameInfo } from '@firestone/stats/common';
import { toFormatType, toGameType } from '@firestone/stats/data-access';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { BattlegroundsStoreService } from '../battlegrounds/store/battlegrounds-store.service';
import { BgsGlobalInfoUpdatedParser } from '../battlegrounds/store/event-parsers/bgs-global-info-updated-parser';
import { Events } from '../events.service';
import { HsGameMetaData } from '../game-mode-data.service';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import {
	MercenariesReferenceData,
	MercenariesReferenceDataService,
} from '../mercenaries/mercenaries-reference-data.service';
import {
	isMercenaries,
	isMercenariesPvE,
	isMercenariesPvP,
	normalizeMercenariesCardId,
} from '../mercenaries/mercenaries-utils';
import { extractHeroTimings } from '../stats/game/game-stats-updater.service';
import { GameParserService } from './game-parser.service';
import { ManastormInfo } from './manastorm-info';
import { ReplayUploadService } from './replay-upload.service';

@Injectable()
export class EndGameUploaderService {
	private readonly supportedModesDeckRetrieve = ['practice', 'friendly', 'ranked', 'casual', 'arena', 'tavern-brawl'];

	constructor(
		private replayUploadService: ReplayUploadService,
		private gameParserService: GameParserService,
		private logService: LogsUploaderService,
		private mainWindowStore: MainWindowStoreService,
		private readonly bgsStore: BattlegroundsStoreService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly events: Events,
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
	) {}

	public async upload2(info: UploadInfo): Promise<void> {
		console.log('[manastorm-bridge]', info.reviewId, 'Uploading game info');
		const { game, xml } = await this.initializeGame(info);
		if (!!game) {
			const metadata = await this.replayUploadService.uploadGame(game, xml);
			this.emitNewGameEvent(game, xml, metadata);
		}
	}

	private emitNewGameEvent(game: GameForUpload, xml: string, metadata: ReplayUploadMetadata) {
		const reviewId = game.reviewId;
		console.log('[manastorm-bridge] Uploaded game', reviewId);
		const info: ManastormInfo = {
			type: 'new-review',
			reviewId: reviewId,
			replayUrl: `https://replays.firestoneapp.com/?reviewId=${reviewId}`,
			game: game,
			xml: xml,
			metadata: metadata,
		};
		this.events.broadcast(Events.REVIEW_FINALIZED, info);
	}

	private async initializeGame(info: UploadInfo): Promise<{ game: GameForUpload; xml: string }> {
		const currentReviewId = info.reviewId;
		// const gameResult = info.gameEnded.game;
		const replayXml = info.gameEnded.replayXml;
		console.debug('[manastorm-bridge]', currentReviewId, 'replayXml', replayXml);

		if (!replayXml) {
			console.warn('[manastorm-bridge]', currentReviewId, 'could not convert replay');
		}
		console.log('[manastorm-bridge]', currentReviewId, 'Creating new game', 'with replay length', replayXml.length);
		const game: GameForUpload = GameForUpload.createEmptyGame(currentReviewId);
		game.uniqueId = info.uniqueId;
		console.log('[manastorm-bridge]', currentReviewId, 'Created new game', game.uniqueId);
		game.gameFormat = toFormatType(info.gameEnded.FormatType);
		console.log('[manastorm-bridge]', currentReviewId, 'parsed format', info.gameEnded.FormatType, game.gameFormat);
		game.gameMode = toGameType(info.gameEnded.GameType);
		console.log('[manastorm-bridge]', currentReviewId, 'parsed type', info.gameEnded.GameType, game.gameMode);

		// Here we want to process the rank info as soon as possible to limit the chances of it
		// being removed from memory by the player clicking away
		let playerRank: string | number;
		let seasonId: number;
		let newPlayerRank: string | number;

		const playerInfo = info.matchInfo?.localPlayer;
		const opponentInfo = info.matchInfo?.opponent;

		const replay = parseHsReplayString(replayXml, this.allCards.getService());
		const prefs = await this.prefs.getPreferences();
		if (isBattlegrounds(game.gameMode)) {
			// If you concede a game before hero selection, the game automatically assigns a hero to you
			// which tends to skew the stats a little bit.
			// For now this pref can't be set anywhere (it's always true). I can't think of a scenario where
			// you would WANT these games to be recorded though, except that it will mess up with the next
			// game's "next MMR" in some cases
			if (prefs.bgsIgnoreGamesEndingBeforeHeroSelection) {
				const durationInTurns = extractTotalTurns(replay);
				console.debug(
					'[manastorm-bridge] bgsIgnoreGamesEndingBeforeHeroSelection is true, duration is',
					durationInTurns,
				);
				if (!durationInTurns) {
					console.debug('[manastorm-bridge] ignoring game ended before hero selection', durationInTurns);
					return { game: null, xml: null };
				}
			}
			console.log(
				'[manastorm-bridge]',
				currentReviewId,
				'memory battlegroundsInfo',
				info.bgInfo?.Rating,
				info.bgInfo?.DuosRating,
				info.bgInfo?.NewRating,
			);
			playerRank = game.gameMode === 'battlegrounds-duo' ? info.bgInfo?.DuosRating : info.bgInfo?.Rating;
			// Some issues with bgsNewRating + spectate?
			newPlayerRank = info.battlegroundsInfoAfterGameOver?.NewRating ?? info.bgInfo?.NewRating;
			const racesFromGame =
				// Sometimes we get an array full of 0s
				info.bgInfo?.Game?.AvailableRaces?.filter((r) => !!r).length === TOTAL_RACES_IN_GAME
					? info.bgInfo?.Game?.AvailableRaces
					: info.battlegroundsInfoAfterGameOver?.Game?.AvailableRaces?.filter((r) => !!r).length ===
					  TOTAL_RACES_IN_GAME
					? info.battlegroundsInfoAfterGameOver?.Game?.AvailableRaces
					: this.bgsStore?.state?.currentGame?.availableRaces;
			const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(racesFromGame);
			console.log('[manastorm-bridge]', currentReviewId, 'available races', availableRaces);
			game.availableTribes = availableRaces;
			game.bannedTribes = bannedRaces;
			game.additionalResult = replay.additionalResult;
			console.log('[manastorm-bridge]', currentReviewId, 'updated player rank', playerRank, newPlayerRank);
			game.hasBgsPrizes = info.gameSettings?.battlegroundsPrizes;
			game.hasBgsSpells = info.gameSettings?.battlegroundsSpells;
			game.bgsAnomalies = info.gameSettings?.battlegroundsAnomalies;
			game.bgBattleOdds = info.bgBattleOdds;
			game.bgGame = info.bgGame;
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

			const referenceData = await this.mercenariesReferenceData.referenceData$$.getValueWithInit();
			const { mercHeroTimings, ...other } = extractHeroTimings(
				{ gameMode: game.gameMode },
				replay,
				referenceData,
				this.allCards.getService(),
			);

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
					? await this.getMercenariesBountyDifficulty(game.mercsBountyId)
					: null;
			game.forceOpponentName =
				game.gameMode === 'mercenaries-pve' || game.gameMode === 'mercenaries-pve-coop'
					? await this.buildOpponentName(info.mercsInfo)
					: null;
		} else if (game.gameMode === 'arena') {
			playerRank = info.arenaInfo ? info.arenaInfo.wins + '-' + info.arenaInfo.losses : undefined;
			game.additionalResult = info.arenaInfo ? info.arenaInfo.wins + '-' + info.arenaInfo.losses : undefined;
			console.log('[manastorm-bridge]', currentReviewId, 'updated player rank for arena', playerRank);
		} else if (game.gameFormat !== 'unknown') {
			if (playerInfo && game.gameFormat === 'standard') {
				seasonId = playerInfo.standard?.seasonId;
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
				seasonId = playerInfo.wild?.seasonId;
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
				seasonId = playerInfo.classic?.seasonId;
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
			} else if (playerInfo && game.gameFormat === 'twist') {
				seasonId = playerInfo.twist?.seasonId;
				if (playerInfo.twist?.legendRank > 0) {
					playerRank = `legend-${playerInfo.twist.legendRank}`;
				} else if (playerInfo.twist.leagueId >= 0 && playerInfo.twist.rankValue >= 0) {
					playerRank = `${playerInfo.twist.leagueId}-${playerInfo.twist.rankValue}`;
				} else {
					console.warn(
						'[manastorm-bridge]',
						currentReviewId,
						'Could not extract twist player rank',
						playerInfo.twist,
					);
					playerRank = null;
				}
			}
		}
		let opponentRank;
		if (isBattlegrounds(game.gameMode) || isMercenaries(game.gameMode)) {
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
		game.playerRank = '' + playerRank;
		game.newPlayerRank = '' + newPlayerRank;
		game.seasonId = seasonId;
		console.log(
			'[manastorm-bridge]',
			currentReviewId,
			'extracted player rank',
			playerRank,
			'and new',
			newPlayerRank,
		);

		game.reviewId = currentReviewId;
		game.buildNumber = info.metadata.BuildNumber;
		// So that we can have overwrites, eg for LETTUCE_PVP_VS_AI
		game.scenarioId = info.gameEnded.ScenarioID; // scenarioId;
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
		// We don't want to store this, as it will drastically increase the memory footprint over time
		// game.uncompressedXmlReplay = replayXml;
		// console.log('[manastorm-bridge]', currentReviewId, 'set xml replay');
		this.gameParserService.extractMatchup(replay, game);
		console.log('[manastorm-bridge]', currentReviewId, 'extracted matchup');
		this.gameParserService.extractDuration(replay, game);
		console.log('[manastorm-bridge]', currentReviewId, 'extracted duration');

		if (game.gameMode === 'arena') {
			game.runId = info.arenaInfo?.runId;
		}

		game.lotteryPoints = info.lotteryPoints;
		game.replay = replay;

		console.log('[manastorm-bridge]', currentReviewId, 'game ready');
		return { game, xml: replayXml };
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

	private async buildOpponentName(mercenariesInfo: MemoryMercenariesInfo): Promise<string> {
		const bountyId = mercenariesInfo?.Map?.BountyId;
		if (bountyId == null) {
			return null;
		}

		const referenceData = await this.mercenariesReferenceData.referenceData$$.getValueWithInit();
		if (!referenceData) {
			return null;
		}

		const allBounties = referenceData.bountySets.map((set) => set.bounties).reduce((a, b) => a.concat(b), []);
		const bounty = allBounties.find((b) => b.id === bountyId);
		if (!bounty) {
			return `${bountyId}`;
		}

		return `${bounty.name} (${mercenariesInfo.Map.CurrentStep} / ${mercenariesInfo.Map.MaxStep})`;
	}

	private async getMercenariesBountyDifficulty(mercsBountyId: number): Promise<'normal' | 'heroic' | 'legendary'> {
		const referenceData = await this.mercenariesReferenceData.referenceData$$.getValueWithInit();
		if (!referenceData) {
			return null;
		}
		const allBounties = referenceData.bountySets.map((set) => set.bounties).reduce((a, b) => a.concat(b), []);
		const bounty = allBounties.find((b) => b.id === mercsBountyId);
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
}

export interface UploadInfo {
	reviewId: string;
	metadata: HsGameMetaData;
	gameEnded: {
		ended: boolean;
		spectating: boolean;
		// game: any;
		replayXml: string;
		FormatType: number;
		GameType: number;
		ScenarioID: number;
	};
	matchInfo: MatchInfo;
	uniqueId: string;
	playerDeck: { deckstring: string; name: string };
	arenaInfo: ArenaInfo;
	mercsInfo: MemoryMercenariesInfo;
	mercsCollectionInfo: MemoryMercenariesCollectionInfo;
	bgInfo: BattlegroundsInfo;
	gameSettings: {
		battlegroundsPrizes: boolean;
		battlegroundsSpells: boolean;
		battlegroundsQuests: boolean;
		battlegroundsAnomalies: readonly string[];
	};
	battlegroundsInfoAfterGameOver?: BattlegroundsInfo;
	xpForGame?: XpForGameInfo;
	bgNewRating: number;
	bgBattleOdds?: readonly { turn: number; wonPercent: number }[];
	bgGame?: BgsGame;
	lotteryPoints?: number;
}
