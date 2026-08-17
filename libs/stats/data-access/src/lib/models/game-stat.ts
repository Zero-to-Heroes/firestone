import { BgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BnetRegion, isMercenariesPvP, Race } from '@firestone-hs/reference-data';
import { CardAnalysis } from '@firestone-hs/replay-metadata';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { StatGameFormatType } from './stat-game-format.type';
import { StatGameModeType } from './stat-game-mode.type';

// this mirrors the data structure in the replay_summary DB
export class GameStat {
	readonly additionalResult: string;
	readonly creationTimestamp: number;
	readonly gameMode: StatGameModeType;
	readonly gameFormat: StatGameFormatType;
	readonly buildNumber: number | undefined;
	readonly scenarioId: number | undefined;
	readonly result: MatchResultType;
	readonly coinPlay: CoinPlayType;
	readonly playerName: string;
	readonly playerClass: string;
	readonly playerRank: string | undefined;
	readonly newPlayerRank: string | undefined;
	readonly playerCardId: string;
	readonly playerDecklist: string | undefined;
	readonly playerDeckName: string | undefined;
	readonly opponentClass: string;
	readonly opponentRank: string | undefined;
	readonly opponentCardId: string;
	readonly opponentName: string;
	readonly reviewId: string;
	readonly powerLogKey?: string | null;
	readonly powerLogAccessed?: boolean;
	readonly gameDurationSeconds: number;
	readonly gameDurationTurns: number;
	readonly runId: string;
	readonly playerArchetypeId?: string;
	readonly opponentArchetypeId?: string;
	readonly bgsAvailableTribes: readonly Race[];
	readonly bgsBannedTribes: readonly Race[];
	readonly bgsPerfectGame: boolean;
	readonly levelAfterMatch: string;
	readonly bgsHasPrizes: boolean;
	readonly bgsHasSpells: boolean;
	readonly bgsHasQuests: boolean;
	readonly bgsHeroQuests: readonly string[];
	readonly bgsAnomalies: readonly string[];
	readonly bgsQuestsCompletedTimings: readonly number[];
	readonly bgsHeroQuestRewards: readonly string[];
	readonly region: BnetRegion;
	readonly bgsTrinkets: readonly string[];
	readonly bgsCompArchetype: string | null;
	/** Compressed + base64 encoded */
	readonly finalComp?: string;

	readonly postMatchStats?: BgsPostMatchStats;
	/** Per-card mulligan/draw flags from MatchAnalysis. Empty array means looked up with no data. */
	readonly cardsAnalysis?: readonly CardAnalysis[] | null;
	/** @deprecated */
	readonly mercHeroTimings: readonly { cardId: string; turnInPlay: number }[];
	/** @deprecated */
	readonly mercOpponentHeroTimings: readonly { cardId: string; turnInPlay: number }[];
	/** @deprecated */
	readonly mercEquipments: readonly { mercCardId: string; equipmentCardId: string }[];
	/** @deprecated */
	readonly mercOpponentEquipments: readonly { mercCardId: string; equipmentCardId: string }[];

	public static create(base: Partial<NonFunctionProperties<GameStat>>): GameStat {
		return Object.assign(new GameStat(), base);
	}

	public update(base: Partial<NonFunctionProperties<GameStat>>): GameStat {
		return Object.assign(new GameStat(), this, base);
	}
}

export const buildNewFormatGameModeImage = (gameMode: 'arena' | 'arena-underground'): string => {
	const gameModeKey = gameMode === 'arena-underground' ? 'arena_underground' : 'arena_new';
	return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/${gameModeKey}.webp`;
};

export const buildRankText = (
	playerRank: string | undefined,
	gameMode: string,
	additionalResult: string,
): string | null => {
	if (playerRank == null) {
		return null;
	}
	if (gameMode === 'ranked') {
		if (playerRank.indexOf('legend-') !== -1) {
			return playerRank.split('legend-')[1];
		} else if (playerRank.indexOf('-') > -1) {
			return playerRank.split('-')[1];
		}
		return playerRank;
	}
	if (gameMode === 'arena' || gameMode === 'arena-underground') {
		if (playerRank && playerRank.indexOf('-') !== -1) {
			const wins = playerRank.split('-')[0];
			const losses = playerRank.split('-')[1];
			return `${wins}-${losses}`;
		} else if (playerRank && playerRank !== 'undefined') {
			return playerRank;
		} else {
			return null;
		}
	}
	// Bug for old matches
	if ((gameMode === 'battlegrounds' || gameMode === 'battlegrounds-duo') && playerRank) {
		return playerRank;
	}
	if (isMercenariesPvP(gameMode) && !isNaN(+playerRank)) {
		return playerRank;
	}
	return null;
};

export type CoinPlayType = 'coin' | 'play';
export type MatchResultType = 'won' | 'lost' | 'tied';
