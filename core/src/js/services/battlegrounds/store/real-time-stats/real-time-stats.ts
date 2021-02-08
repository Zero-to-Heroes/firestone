import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BooleanTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/boolean-turn-info';
import { ComplexTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/complex-turn-info';
import { NumericTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/numeric-turn-info';
import { ValueHeroInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/value-hero-info';
import {
	BattleResultHistory,
	BgsComposition,
	BgsPostMatchStats as IBgsPostMatchStats,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameType } from '@firestone-hs/reference-data';
import { BgsBoard } from '../../../../models/battlegrounds/in-game/bgs-board';
import { BgsTavernUpgrade } from '../../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../../models/battlegrounds/in-game/bgs-triple';

export class RealTimeStatsState implements IBgsPostMatchStats {
	readonly gameType: GameType;
	readonly currentTurn: number;
	readonly gameOver: boolean;
	readonly replayLink: string;

	readonly resourcesAvailableThisTurn: number = 0;
	readonly resourcesUsedThisTurn: number = 0;
	// Coins means any form of mana resource
	readonly coinsWastedOverTurn: readonly NumericTurnInfo[] = [];
	readonly mainPlayerHeroPowersOverTurn: readonly NumericTurnInfo[] = [];
	readonly hpOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] } = {};
	readonly totalStatsOverTurn: readonly NumericTurnInfo[] = [];
	readonly damageToEnemyHeroOverTurn: readonly ComplexTurnInfo<ValueHeroInfo>[] = [];
	readonly totalMinionsDamageDealt: { [cardId: string]: number } = {};
	readonly totalMinionsDamageTaken: { [cardId: string]: number } = {};
	readonly totalEnemyMinionsKilled: number;
	readonly totalEnemyHeroesKilled: number;

	// BG specific
	readonly tavernTimings: readonly BgsTavernUpgrade[] = [];
	readonly boardHistory: readonly BgsBoard[] = [];
	readonly compositionsOverTurn: readonly BgsComposition[] = [];
	readonly rerollsOverTurn: readonly NumericTurnInfo[] = [];
	readonly freezesOverTurn: readonly NumericTurnInfo[] = [];
	readonly leaderboardPositionOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] } = {};
	readonly wentFirstInBattleOverTurn: readonly BooleanTurnInfo[] = [];
	readonly minionsBoughtOverTurn: readonly NumericTurnInfo[] = [];
	readonly minionsSoldOverTurn: readonly NumericTurnInfo[] = [];
	readonly luckFactor: number;
	readonly battleResultHistory: readonly BattleResultHistory[] = [];
	readonly faceOffs: readonly BgsFaceOff[] = [];
	readonly currentWinStreak: number = 0;
	readonly highestWinStreak: number = 0;
	readonly triplesPerHero: { [heroCardId: string]: number } = {};

	// For now this one is not populated, as the post-match stats don't actually care about the timings
	// but only the size
	readonly tripleTimings: readonly BgsTriple[] = [];
	// Not sure what this is used for anymore, since we have rerollsOverTurn
	/** @deprecated */
	readonly rerolls: number;

	public static create(base: RealTimeStatsState): RealTimeStatsState {
		return Object.assign(new RealTimeStatsState(), base);
	}

	public update(base: RealTimeStatsState): RealTimeStatsState {
		return Object.assign(new RealTimeStatsState(), this, base);
	}
}
