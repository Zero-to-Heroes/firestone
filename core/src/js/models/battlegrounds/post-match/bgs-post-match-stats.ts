import { BgsBoard } from '../in-game/bgs-board';
import { BgsTavernUpgrade } from '../in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../in-game/bgs-triple';
import { NumericTurnInfo } from './numeric-turn-info';

export class BgsPostMatchStats {
	readonly tavernTimings: readonly BgsTavernUpgrade[];
	readonly tripleTimings: readonly BgsTriple[];
	readonly rerolls: number;

	readonly replayLink: string;

	readonly boardHistory: readonly BgsBoard[];
	// readonly compositionsOverTurn: readonly BgsCompositionForTurn[];
	readonly rerollsOverTurn: readonly NumericTurnInfo[];
	readonly freezesOverTurn: readonly NumericTurnInfo[];
	readonly coinsWastedOverTurn: readonly NumericTurnInfo[];
	readonly mainPlayerHeroPowersOverTurn: readonly NumericTurnInfo[];
	readonly hpOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] };
	readonly leaderboardPositionOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] };
	readonly totalStatsOverTurn: readonly NumericTurnInfo[];

	readonly minionsBoughtOverTurn: readonly NumericTurnInfo[];
	readonly minionsSoldOverTurn: readonly NumericTurnInfo[];

	readonly totalMinionsDamageDealt: { [cardId: string]: number };
	readonly totalMinionsDamageTaken: { [cardId: string]: number };
	// readonly minionsKilled: number;
	// readonly heroesTakenDown: number;
	// readonly minionsBought: number;
	// readonly minionsSold: number;
	// readonly heroPowersUsed: number;
	// readonly freezes: number;

	// readonly percentageOfGoingFirst: number;

	public static create(base: BgsPostMatchStats): BgsPostMatchStats {
		return Object.assign(new BgsPostMatchStats(), base);
	}
}
