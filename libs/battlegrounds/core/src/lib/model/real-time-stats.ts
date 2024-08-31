import {
	BattleResultHistory,
	BgsComposition,
	BgsFaceOff,
	BooleanTurnInfo,
	ComplexTurnInfo,
	BgsPostMatchStats as IBgsPostMatchStats,
	NumericTurnInfo,
	ValueHeroInfo,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameType } from '@firestone-hs/reference-data';
import { BgsBoard } from './in-game/bgs-board';
import { BgsTavernUpgrade } from './in-game/bgs-tavern-upgrade';
import { BgsTriple } from './in-game/bgs-triple';

export class RealTimeStatsState implements IBgsPostMatchStats {
	readonly reconnectOngoing: boolean;
	readonly gameType: GameType;
	readonly currentTurn: number;
	readonly gameOver: boolean;
	readonly replayLink: string;

	readonly playerIdToCardIdMapping: { [playerId: string]: string } = {};

	readonly resourcesAvailableThisTurn: number = 0;
	readonly resourcesUsedThisTurn: number = 0;
	// Coins means any form of mana resource
	readonly coinsWastedOverTurn: readonly NumericTurnInfo[] = [];
	readonly mainPlayerHeroPowersOverTurn: readonly NumericTurnInfo[] = [];
	readonly hpOverTurn: { [playerId: string]: readonly HpTurnInfo[] } = {};
	readonly totalStatsOverTurn: readonly NumericTurnInfo[] = [];
	readonly damageToEnemyHeroOverTurn: readonly ComplexTurnInfo<ValueHeroInfo>[] = [];
	readonly totalMinionsDamageDealt: { [cardId: string]: number } = {};
	readonly totalMinionsDamageTaken: { [cardId: string]: number } = {};
	readonly totalEnemyMinionsKilled: number = 0;
	readonly totalEnemyHeroesKilled: number = 0;

	// BG specific
	readonly tavernTimings: readonly BgsTavernUpgrade[] = [];
	readonly boardHistory: readonly BgsBoard[] = [];
	readonly compositionsOverTurn: readonly BgsComposition[] = [];
	readonly rerollsOverTurn: readonly NumericTurnInfo[] = [];
	readonly freezesOverTurn: readonly NumericTurnInfo[] = [];
	readonly leaderboardPositionOverTurn: { [playerId: string]: readonly NumericTurnInfo[] } = {};
	readonly wentFirstInBattleOverTurn: readonly BooleanTurnInfo[] = [];
	readonly minionsBoughtOverTurn: readonly NumericTurnInfoWithCardIds[] = [];
	readonly minionsPlayedOverTurn: readonly NumericTurnInfo[] = [];
	readonly minionsSoldOverTurn: readonly NumericTurnInfo[] = [];
	readonly luckFactor: number = 0;
	readonly battleResultHistory: readonly BattleResultHistory[] = [];
	readonly faceOffs: readonly BgsFaceOff[] = [];
	readonly currentWinStreak: number = 0;
	readonly highestWinStreak: number = 0;
	readonly triplesPerHero: { [playerId: string]: number } = {};

	// For now this one is not populated, as the post-match stats don't actually care about the timings
	// but only the size
	readonly tripleTimings: readonly BgsTriple[] = [];
	// Not sure what this is used for anymore, since we have rerollsOverTurn
	/** @deprecated */
	readonly rerolls: number = 0;

	public static create(base: RealTimeStatsState): RealTimeStatsState {
		return Object.assign(new RealTimeStatsState(), base);
	}

	public update(base: RealTimeStatsState): RealTimeStatsState {
		return Object.assign(new RealTimeStatsState(), this, base);
	}
}

export interface HpTurnInfo extends NumericTurnInfo {
	readonly armor: number;
}

export interface NumericTurnInfoWithCardIds extends NumericTurnInfo {
	readonly cardIds: readonly string[];
}
